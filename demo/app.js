import L from 'https://cdn.skypack.dev/leaflet@1.9.4';

const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const statusEl = document.getElementById('status');
const form = document.getElementById('natal-form');
let overlays = [];

function bodyLabel(body) {
  if (!body) return 'unknown';
  if (typeof body === 'string') return body.replace(/_/g, ' ');
  const base = body.name ? body.name : `asteroid ${body.asteroid}`;
  return base;
}

function lineLabel(line) {
  const who = bodyLabel(line.body);
  const kind = line.kind === 'LOCAL_SPACE' ? 'Local Space' : line.kind;
  return `${who} — ${kind}`;
}

function clearOverlays() {
  overlays.forEach((o) => map.removeLayer(o));
  overlays = [];
}

function colorByBody(body) {
  if (typeof body === 'string') {
    switch (body) {
      case 'sun': return '#fbbf24';
      case 'moon': return '#a3a3a3';
      case 'mercury': return '#8b5cf6';
      case 'venus': return '#ec4899';
      case 'mars': return '#ef4444';
      case 'jupiter': return '#f97316';
      case 'saturn': return '#0ea5e9';
      case 'uranus': return '#06b6d4';
      case 'neptune': return '#3b82f6';
      case 'pluto': return '#6366f1';
      default: return '#22c55e';
    }
  }
  return '#c084fc';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = 'Computing...';
  clearOverlays();
  const data = new FormData(form);
  const [year, month, day] = data.get('date').split('-').map(Number);
  const [hour, minute] = data.get('time').split(':').map(Number);
  const bodies = String(data.get('bodies')).split(',').map((s) => s.trim()).filter(Boolean);
  const payload = {
    datetime: { year, month, day, hour, minute, timezone: data.get('timezone') || 'UTC' },
    location: { lat: Number(data.get('lat')), lon: Number(data.get('lon')), alt: Number(data.get('alt') || 0) },
    bodies,
    options: {
      system: data.get('system'),
      angularOrbDeg: Number(data.get('orb')),
      samplingStepDeg: 0.5,
      geoOrbKm: 300,
      cache: false,
    },
    radiusKm: Number(data.get('radius') || 500),
  };
  try {
    const res = await fetch('/api/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    console.info('API response', json);
    renderACG(json.acg);
    renderLocalSpace(json.localSpace);
    renderCrossings(json.acg.crossings);
    fitToOverlays();
    statusEl.textContent = `Done (lines ${json.acg.lines.length}, crossings ${json.acg.crossings.length}, ls ${json.localSpace.lines.length})`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = err.message;
  }
});

function renderACG(acg) {
  if (!acg?.lines) return;
  acg.lines.forEach((line) => {
    if (!line.coordinates || line.coordinates.length < 2) return;
    const latlngs = line.coordinates
      .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon))
      .map((c) => [c.lat, c.lon]);
    if (latlngs.length < 2) return;
    const poly = L.polyline(latlngs, { color: colorByBody(line.body), weight: 2, opacity: 0.8 }).addTo(map);
    poly.bindTooltip(lineLabel(line), { sticky: true, opacity: 0.9 });
    overlays.push(poly);
  });
}

function renderLocalSpace(ls) {
  if (!ls?.lines) return;
  ls.lines.forEach((line) => {
    if (!line.coordinates || line.coordinates.length < 2) return;
    const latlngs = line.coordinates
      .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon))
      .map((c) => [c.lat, c.lon]);
    if (latlngs.length < 2) return;
    const poly = L.polyline(latlngs, { color: '#eab308', weight: 1, dashArray: '4,2', opacity: 0.8 }).addTo(map);
    const bearing = Number.isFinite(line.bearing) ? `${Math.round(line.bearing)}°` : '';
    const label = `${bodyLabel(line.body)} — Local Space${bearing ? ` (${bearing})` : ''}`;
    poly.bindTooltip(label, { sticky: true, opacity: 0.9 });
    overlays.push(poly);
  });
  if (ls?.origin && Number.isFinite(ls.origin.lat) && Number.isFinite(ls.origin.lon)) {
    const marker = L.marker([ls.origin.lat, ls.origin.lon]).addTo(map);
    marker.bindTooltip('Luogo natale', { direction: 'top', sticky: true, opacity: 0.9 });
    overlays.push(marker);
  }
}

function renderCrossings(crossings) {
  crossings.slice(0, 200).forEach((c) => {
    if (!c?.at) return;
    const m = L.circleMarker([c.at.lat, c.at.lon], {
      radius: 4,
      color: c.classification === 'real' ? '#f97316' : '#a855f7',
      weight: 2,
      fillOpacity: 0.7,
    }).addTo(map);
    const [l1, l2] = c.lines || [];
    const latStr = c.at.lat.toFixed(2);
    const lonStr = c.at.lon.toFixed(2);
    const label = l1 && l2
      ? `${lineLabel(l1)} × ${lineLabel(l2)} (${c.classification})<br>${latStr}, ${lonStr}`
      : `Crossing (${c.classification})<br>${latStr}, ${lonStr}`;
    m.bindTooltip(label, { sticky: true, opacity: 0.9 });
    overlays.push(m);
  });
}

function fitToOverlays() {
  const latlngs = [];
  overlays.forEach((o) => {
    if (o.getLatLng) {
      latlngs.push(o.getLatLng());
    } else if (o.getLatLngs) {
      const pts = o.getLatLngs().flat(Infinity);
      pts.forEach((p) => latlngs.push(p));
    }
  });
  if (latlngs.length > 0) {
    map.fitBounds(L.latLngBounds(latlngs), { padding: [20, 20] });
  }
}
