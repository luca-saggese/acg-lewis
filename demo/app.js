import L from 'https://cdn.skypack.dev/leaflet@1.9.4';

const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const statusEl = document.getElementById('status');
const form = document.getElementById('natal-form');
let overlays = [];

function clearOverlays() {
  overlays.forEach((o) => map.removeLayer(o));
  overlays = [];
}

function colorByKind(kind) {
  switch (kind) {
    case 'MC': return '#22c55e';
    case 'IC': return '#14b8a6';
    case 'ASC': return '#3b82f6';
    case 'DSC': return '#ef4444';
    case 'LOCAL_SPACE': return '#eab308';
    default: return '#c084fc';
  }
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
      samplingStepDeg: 1,
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
    const poly = L.polyline(latlngs, { color: colorByKind(line.kind), weight: 2, opacity: 0.8 }).addTo(map);
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
    overlays.push(poly);
  });
  if (ls?.origin && Number.isFinite(ls.origin.lat) && Number.isFinite(ls.origin.lon)) {
    const marker = L.marker([ls.origin.lat, ls.origin.lon]).addTo(map);
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
