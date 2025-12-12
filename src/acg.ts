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
  const step = opts.samplingStepDeg ?? 1; // degrees in longitude
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

function findClosestApproach(
  a1: { lat: number; lon: number },
  a2: { lat: number; lon: number },
  b1: { lat: number; lon: number },
  b2: { lat: number; lon: number }
): { distance: number; point: { lat: number; lon: number } } | null {
  // Quick endpoint check
  const maxEndpointDist = Math.max(
    haversineKm(a1, b1), haversineKm(a1, b2),
    haversineKm(a2, b1), haversineKm(a2, b2)
  );
  if (maxEndpointDist < 50) {
    // segments are very close, skip detailed check
    const midA = { lat: (a1.lat + a2.lat) / 2, lon: (a1.lon + a2.lon) / 2 };
    const midB = { lat: (b1.lat + b2.lat) / 2, lon: (b1.lon + b2.lon) / 2 };
    return { distance: haversineKm(midA, midB), point: { lat: (midA.lat + midB.lat) / 2, lon: (midA.lon + midB.lon) / 2 } };
  }

  const minEndpointDist = Math.min(
    haversineKm(a1, b1), haversineKm(a1, b2),
    haversineKm(a2, b1), haversineKm(a2, b2)
  );
  if (minEndpointDist > 300) return null; // too far to intersect

  // Sample to find closest approach
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

  if (minDist < 30 && bestPoint) {
    return { distance: minDist, point: bestPoint };
  }
  return null;
}

function findCrossings(lines: CoordinateLine[]): Crossing[] {
  const rawCrossings: Array<{ at: { lat: number; lon: number }; lines: [CoordinateLine, CoordinateLine]; distance: number }> = [];

  // Find all pairwise close approaches
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const l1 = lines[i];
      const l2 = lines[j];
      for (let s1 = 0; s1 < l1.coordinates.length - 1; s1++) {
        for (let s2 = 0; s2 < l2.coordinates.length - 1; s2++) {
          const result = findClosestApproach(
            l1.coordinates[s1],
            l1.coordinates[s1 + 1],
            l2.coordinates[s2],
            l2.coordinates[s2 + 1],
          );
          if (result && result.distance < 10) {
            rawCrossings.push({ at: result.point, lines: [l1, l2], distance: result.distance });
          }
        }
      }
    }
  }

  // Deduplicate: merge crossings within 20 km
  const merged: Crossing[] = [];
  const used = new Set<number>();

  for (let i = 0; i < rawCrossings.length; i++) {
    if (used.has(i)) continue;
    const cluster = [rawCrossings[i]];
    used.add(i);

    for (let j = i + 1; j < rawCrossings.length; j++) {
      if (used.has(j)) continue;
      if (haversineKm(rawCrossings[i].at, rawCrossings[j].at) < 20) {
        cluster.push(rawCrossings[j]);
        used.add(j);
      }
    }

    // Average position
    const avgLat = cluster.reduce((sum, c) => sum + c.at.lat, 0) / cluster.length;
    const avgLon = cluster.reduce((sum, c) => sum + c.at.lon, 0) / cluster.length;
    const at = { lat: avgLat, lon: avgLon };

    // Collect unique lines
    const uniqueLines = new Map<string, CoordinateLine>();
    cluster.forEach((c) => {
      const key1 = `${c.lines[0].body}-${c.lines[0].kind}`;
      const key2 = `${c.lines[1].body}-${c.lines[1].kind}`;
      uniqueLines.set(key1, c.lines[0]);
      uniqueLines.set(key2, c.lines[1]);
    });

    const allLines = Array.from(uniqueLines.values());
    const classification: 'real' | 'pseudo' = Math.abs(at.lat) > 85 ? 'pseudo' : 'real';

    // Store first two lines for backwards compatibility
    merged.push({
      at,
      lines: [allLines[0], allLines[1]],
      classification,
    });
  }

  return merged;
}
