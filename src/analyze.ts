import type {
  ACGLinesResult,
  Angle,
  Body,
  CalculationOptions,
  Location,
  LocationAnalysisItem,
  LocationAnalysisResult,
  Paran,
} from './types';
import { classifyStrength, haversineKm, pointSegmentDistanceKm } from './utils';

const VERSION = '0.1.0';

export function analyzeLocation(
  city: Location,
  radiusKm: number,
  acg: ACGLinesResult,
  parans: Paran[],
  opts: CalculationOptions,
): LocationAnalysisResult {
  const geoOrb = opts.geoOrbKm ?? 300;
  const active: LocationAnalysisItem[] = [];

  for (const line of acg.lines) {
    const closest = minDistanceToLine(city, line.coordinates);
    if (closest <= radiusKm || radiusKm === -1) {
      const strength = classifyStrength(closest, geoOrb);
      const force = Math.exp(-closest / geoOrb);
      active.push({ body: line.body, angle: line.kind as Angle, distanceKm: closest, strength, force });
    }
  }

  const ranking = [...active].sort(
    (a, b) => compositeWeight(b) - compositeWeight(a),
  );
  const paransInArea = radiusKm === -1 ? parans : parans.filter((p) => Math.abs(p.latitude - city.lat) <= radiusKm / 111);

  return { city, radiusKm, active, parans: paransInArea, ranking, version: VERSION };
}

function minDistanceToLine(point: Location, coords: { lat: number; lon: number }[]): number {
  if (coords.length === 0) return Number.POSITIVE_INFINITY;
  if (coords.length === 1) return haversineKm(point, coords[0]);
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointSegmentDistanceKm(point, coords[i], coords[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

function strengthWeight(s: ReturnType<typeof classifyStrength>): number {
  switch (s) {
    case 'strong':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}

function anglePriority(angle: Angle): number {
  if (angle === 'MC' || angle === 'ASC') return 2;
  return 1;
}

function compositeWeight(item: LocationAnalysisItem): number {
  return strengthWeight(item.strength) * anglePriority(item.angle) * bodyPriority(item.body) * item.force;
}

function bodyPriority(body: Body): number {
  if (typeof body !== 'string') return 1;
  const personal = ['sun', 'moon', 'mercury', 'venus', 'mars'];
  const social = ['jupiter', 'saturn'];
  if (personal.includes(body)) return 1.3;
  if (social.includes(body)) return 1.1;
  return 1.0;
}
