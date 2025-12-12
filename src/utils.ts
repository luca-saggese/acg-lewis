import type { Coordinate, GeoJSONLineString, LineStrength } from './types';

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function degToRad(deg: number): number {
  return deg * DEG2RAD;
}

export function radToDeg(rad: number): number {
  return rad * RAD2DEG;
}

export function normalizeDeg(deg: number): number {
  const res = ((deg % 360) + 360) % 360;
  return res === 360 ? 0 : res;
}

export function normalizeHour(hours: number): number {
  const res = ((hours % 24) + 24) % 24;
  return res === 24 ? 0 : res;
}

export function clampLat(lat: number): number {
  return Math.max(-89.999, Math.min(89.999, lat));
}

export function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371; // Earth radius km
  const dLat = degToRad(b.lat - a.lat);
  const dLon = degToRad(b.lon - a.lon);
  const lat1 = degToRad(a.lat);
  const lat2 = degToRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function pointSegmentDistanceKm(p: Coordinate, a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const φ1 = degToRad(a.lat);
  const λ1 = degToRad(a.lon);
  const φ2 = degToRad(b.lat);
  const λ2 = degToRad(b.lon);
  const φp = degToRad(p.lat);
  const λp = degToRad(p.lon);

  const d13 = haversineKm(a, p) / R; // in radians
  const θ13 = bearingRad(a, p);
  const θ12 = bearingRad(a, b);
  const dXt = Math.asin(Math.sin(d13) * Math.sin(θ13 - θ12));
  const dAt = Math.acos(Math.cos(d13) / Math.cos(dXt));
  const d12 = haversineKm(a, b) / R;

  let dist;
  if (dAt < 0) {
    dist = haversineKm(p, a);
  } else if (dAt > d12) {
    dist = haversineKm(p, b);
  } else {
    dist = Math.abs(dXt) * R;
  }
  return dist;
}

function bearingRad(a: Coordinate, b: Coordinate): number {
  const φ1 = degToRad(a.lat);
  const φ2 = degToRad(b.lat);
  const Δλ = degToRad(b.lon - a.lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return Math.atan2(y, x);
}

export function toGeoJSONLineString(coords: Coordinate[], properties?: Record<string, unknown>): GeoJSONLineString {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coords.map((c) => [normalizeLon(c.lon), c.lat]),
    },
    properties,
  };
}

export function normalizeLon(lon: number): number {
  const res = ((lon + 180) % 360 + 360) % 360 - 180;
  return res;
}

export function classifyStrength(distanceKm: number, geoOrbKm: number): LineStrength {
  if (distanceKm <= geoOrbKm * 0.33) return 'strong';
  if (distanceKm <= geoOrbKm * 0.66) return 'medium';
  return 'weak';
}

export function interpolateGreatCircle(start: Coordinate, bearingDeg: number, distanceKm: number, stepKm = 50): Coordinate[] {
  const R = 6371;
  const brng = degToRad(bearingDeg);
  const coords: Coordinate[] = [];
  const steps = Math.max(2, Math.ceil(distanceKm / stepKm));
  for (let i = 0; i <= steps; i++) {
    const d = (distanceKm * i) / steps;
    const angDist = d / R;
    const lat1 = degToRad(start.lat);
    const lon1 = degToRad(start.lon);
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angDist) +
        Math.cos(lat1) * Math.sin(angDist) * Math.cos(brng),
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(angDist) * Math.cos(lat1),
        Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2),
      );
    coords.push({ lat: radToDeg(lat2), lon: normalizeLon(radToDeg(lon2)) });
  }
  return coords;
}
