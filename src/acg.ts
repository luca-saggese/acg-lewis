import type { ACGLinesResult, Angle, Body, CalculationOptions, CoordinateLine, Crossing, Location } from './types';
import { attachLst, computeBodyPosition, normalizeDateTime, siderealTimes, toJulianDayUTC } from './ephemeris';
import { clampLat, normalizeDeg, normalizeLon, normalizeHour, toGeoJSONLineString, radToDeg, degToRad, haversineKm } from './utils';

const VERSION = '0.1.0';

export function computeACG(
  datetime: Parameters<typeof normalizeDateTime>[0],
  opts: CalculationOptions,
  bodies: Body[],
  baseLocation?: Location,
): ACGLinesResult {
  const normalized = normalizeDateTime(datetime);
  const jdUt = toJulianDayUTC(normalized);
  if (opts.ephemerisPath) {
    // lazy init in ephemeris module
  }
  const gst = siderealTimes(jdUt, 0).gst;
  const lines: CoordinateLine[] = [];

  const baseLon = baseLocation?.lon ?? 0;
  const lstBase = siderealTimes(jdUt, baseLon).lst;
  const positions = bodies.map((body) => {
    const pos = computeBodyPosition(jdUt, body, opts, baseLocation);
    return attachLst(pos, lstBase);
  });

  for (const pos of positions) {
    lines.push(...buildAngularLines(pos, gst, opts));
  }

  const crossings = findCrossings(lines);

  return {
    timestamp: new Date().toISOString(),
    gst,
    bodies: positions,
    lines,
    crossings,
    version: VERSION,
    options: opts,
  };
}

function buildAngularLines(pos: { ra: number; dec: number; body: Body }, gst: number, opts: CalculationOptions): CoordinateLine[] {
  const mcLon = normalizeLon((pos.ra - gst) * 15);
  const icLon = normalizeLon(((pos.ra + 12) - gst) * 15);

  const mc: CoordinateLine = {
    kind: 'MC',
    body: pos.body,
    coordinates: [
      { lat: 89.999, lon: mcLon },
      { lat: -89.999, lon: mcLon },
    ],
    geojson: toGeoJSONLineString([
      { lat: 89.999, lon: mcLon },
      { lat: -89.999, lon: mcLon },
    ]),
  };

  const ic: CoordinateLine = {
    kind: 'IC',
    body: pos.body,
    coordinates: [
      { lat: 89.999, lon: icLon },
      { lat: -89.999, lon: icLon },
    ],
    geojson: toGeoJSONLineString([
      { lat: 89.999, lon: icLon },
      { lat: -89.999, lon: icLon },
    ]),
  };

  const ascLine = buildAscDscCurve(pos, gst, 'ASC', opts);
  const dscLine = buildAscDscCurve(pos, gst, 'DSC', opts);

  return [mc, ic, ascLine, dscLine];
}

function buildAscDscCurve(pos: { ra: number; dec: number; body: Body }, gst: number, angle: Angle, opts: CalculationOptions): CoordinateLine {
  const step = opts.samplingStepDeg ?? 2; // degrees in longitude
  const allPoints = [] as { lat: number; lon: number; H: number }[];
  const altOffset = opts.refractAscDsc ? degToRad(-0.5667) : 0; // approximate refraction at horizon
  
  for (let lon = -180; lon <= 180; lon += step) {
    const lst = normalizeHour(gst + lon / 15);
    const H = degToRad((lst - pos.ra) * 15);
    const decRad = degToRad(pos.dec);
    
    // For rising/setting (altitude = 0):
    // sin(0) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(H)
    // 0 = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(H)
    // tan(lat) = -cos(dec)*cos(H) / sin(dec)
    // This gives two solutions; we want the one matching the hemisphere
    
    const tanLat = -Math.cos(decRad) * Math.cos(H) / Math.sin(decRad);
    let latRad = Math.atan(tanLat);
    
    // Adjust quadrant: if dec > 0 and H in [0, pi], lat should be positive
    // The atan only gives values in [-pi/2, pi/2]
    // For correct quadrant, check if the solution makes sense
    const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(H);
    if (Math.abs(sinAlt) > 0.1) {
      // Wrong quadrant, flip by pi
      latRad = latRad > 0 ? latRad - Math.PI : latRad + Math.PI;
    }

    if (opts.refractAscDsc) {
      latRad = solveLatitudeForAltitude(decRad, H, altOffset, latRad);
    }

    let lat = radToDeg(latRad);
    lat = clampLat(lat);
    allPoints.push({ lat, lon: normalizeLon(lon), H });
  }
  
  // Filter points where sin(H) matches the desired angle
  const wantSign = angle === 'ASC' ? -1 : 1;
  const filtered = allPoints.filter(pt => {
    const currentSign = Math.sin(pt.H) < 0 ? -1 : 1;
    return currentSign === wantSign;
  });
  
  // Split at longitude discontinuities (antimeridian crossings)
  const segments: Array<Array<{ lat: number; lon: number }>> = [];
  let currentSegment: Array<{ lat: number; lon: number }> = [];
  
  for (let i = 0; i < filtered.length; i++) {
    const pt = filtered[i];
    if (currentSegment.length > 0) {
      const prev = currentSegment[currentSegment.length - 1];
      const lonJump = Math.abs(pt.lon - prev.lon);
      // If jump > 180deg, it's wrapping the antimeridian
      if (lonJump > 180) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
    currentSegment.push({ lat: pt.lat, lon: pt.lon });
  }
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }
  
  // Use the longest continuous segment
  const coords = segments.length > 0 
    ? segments.reduce((a, b) => a.length > b.length ? a : b, [])
    : [];
  
  return {
    kind: angle,
    body: pos.body,
    coordinates: coords,
    geojson: toGeoJSONLineString(coords),
  };
}

function apparentAltitude(latRad: number, decRad: number, H: number): number {
  return Math.asin(Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(H));
}

function solveLatitudeForAltitude(decRad: number, H: number, targetAlt: number, initialLat: number): number {
  let low = degToRad(-89.9);
  let high = degToRad(89.9);
  let lat = initialLat;
  for (let i = 0; i < 12; i++) {
    const alt = apparentAltitude(lat, decRad, H);
    if (Math.abs(alt - targetAlt) < 1e-5) break;
    if (alt > targetAlt) {
      high = lat;
    } else {
      low = lat;
    }
    lat = (low + high) / 2;
  }
  return lat;
}

function segmentsIntersect(a1: { lat: number; lon: number }, a2: { lat: number; lon: number }, b1: { lat: number; lon: number }, b2: { lat: number; lon: number }) {
  const det = (a2.lon - a1.lon) * (b2.lat - b1.lat) - (a2.lat - a1.lat) * (b2.lon - b1.lon);
  if (Math.abs(det) < 1e-12) return null;
  const t = ((b1.lat - a1.lat) * (b2.lon - b1.lon) - (b1.lon - a1.lon) * (b2.lat - b1.lat)) / det;
  const u = ((b1.lat - a1.lat) * (a2.lon - a1.lon) - (b1.lon - a1.lon) * (a2.lat - a1.lat)) / det;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      lat: a1.lat + t * (a2.lat - a1.lat),
      lon: a1.lon + t * (a2.lon - a1.lon),
    };
  }
  return null;
}

function findCrossings(lines: CoordinateLine[]): Crossing[] {
  const crossings: Crossing[] = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const l1 = lines[i];
      const l2 = lines[j];
      for (let s1 = 0; s1 < l1.coordinates.length - 1; s1++) {
        for (let s2 = 0; s2 < l2.coordinates.length - 1; s2++) {
          const p = segmentsIntersect(
            l1.coordinates[s1],
            l1.coordinates[s1 + 1],
            l2.coordinates[s2],
            l2.coordinates[s2 + 1],
          );
          if (p) {
            const classification: 'real' | 'pseudo' = Math.abs(p.lat) > 85 ? 'pseudo' : 'real';
            crossings.push({ at: p, lines: [l1, l2], classification });
          } else {
            const d = haversineKm(l1.coordinates[s1], l2.coordinates[s2]);
            if (d < 50) {
              crossings.push({ at: l1.coordinates[s1], lines: [l1, l2], classification: 'pseudo' });
            }
          }
        }
      }
    }
  }
  return crossings;
}
