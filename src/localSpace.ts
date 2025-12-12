import type { Body, CalculationOptions, LocalSpaceLine, LocalSpaceResult, Location } from './types';
import { computeBodyPosition, normalizeDateTime, siderealTimes, toJulianDayUTC } from './ephemeris';
import { degToRad, interpolateGreatCircle, normalizeHour, radToDeg, normalizeLon } from './utils';

const VERSION = '0.1.0';

export function computeLocalSpace(
  datetime: Parameters<typeof normalizeDateTime>[0],
  origin: Location,
  opts: CalculationOptions,
  bodies: Body[],
): LocalSpaceResult {
  const normalized = normalizeDateTime(datetime);
  const jdUt = toJulianDayUTC(normalized);
  const lst = siderealTimes(jdUt, origin.lon).lst;

  const lines: LocalSpaceLine[] = [];
  for (const body of bodies) {
    const pos = computeBodyPosition(jdUt, body, opts, origin);
    const az = azimuth(pos.ra, pos.dec, lst, origin.lat);
    const coords = interpolateGreatCircle(origin, az, 20000, 100); // full great-circle
    lines.push({ body, bearing: az, coordinates: coords });
  }

  return { origin, lines, version: VERSION };
}

function azimuth(raHours: number, decDeg: number, lstHours: number, latDeg: number): number {
  const H = degToRad((lstHours - raHours) * 15);
  const dec = degToRad(decDeg);
  const lat = degToRad(latDeg);
  const y = Math.sin(H);
  const x = Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat);
  let az = radToDeg(Math.atan2(y, x));
  az = normalizeLon(az + 180); // convert to bearing from north
  return az;
}
