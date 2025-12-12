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
  const coords = [] as { lat: number; lon: number }[];
  const altOffset = opts.refractAscDsc ? degToRad(-0.5667) : 0; // approximate refraction at horizon
  for (let lon = -180; lon <= 180; lon += step) {
    const lst = normalizeHour(gst + lon / 15);
    const H = degToRad((lst - pos.ra) * 15);
    const decRad = degToRad(pos.dec);
    let latRad = Math.atan2(-Math.cos(H) * Math.cos(decRad), Math.sin(decRad));

    if (opts.refractAscDsc) {
      // refine latitude so that apparent altitude equals altOffset (negative)
      latRad = solveLatitudeForAltitude(decRad, H, altOffset, latRad);
    }

    let lat = radToDeg(latRad);
    lat = clampLat(lat);
    const isAsc = Math.sin(H) < 0;
    if ((angle === 'ASC' && isAsc) || (angle === 'DSC' && !isAsc)) {
      coords.push({ lat, lon: normalizeLon(lon) });
    }
  }
  // ensure continuity by sorting longitudes
  coords.sort((a, b) => a.lon - b.lon);
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
  // Sample both segments densely and find closest approach
  const samples = 20;
  let minDist = Infinity;
  let bestPoint: { lat: number; lon: number } | null = null;
  
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pA = {
      lat: a1.lat + t * (a2.lat - a1.lat),
      lon: a1.lon + t * (a2.lon - a1.lon),
    };
    
    for (let j = 0; j <= samples; j++) {
      const u = j / samples;
      const pB = {
        lat: b1.lat + u * (b2.lat - b1.lat),
        lon: b1.lon + u * (b2.lon - b1.lon),
      };
      
      const d = haversineKm(pA, pB);
      if (d < minDist) {
        minDist = d;
        bestPoint = { lat: (pA.lat + pB.lat) / 2, lon: (pA.lon + pB.lon) / 2 };
      }
    }
  }
  
  // Consider it a crossing if closest approach is < 10 km
  if (minDist < 10) {
    return bestPoint;
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
          }
        }
      }
    }
  }
  return crossings;
}
