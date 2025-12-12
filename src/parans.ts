import type { Angle, Body, CalculationOptions, ParansResult, Paran } from './types';
import { computeBodyPosition, normalizeDateTime, siderealTimes, toJulianDayUTC } from './ephemeris';
import { degToRad, radToDeg } from './utils';

const VERSION = '0.1.0';

export function computeParans(
  datetime: Parameters<typeof normalizeDateTime>[0],
  opts: CalculationOptions,
  bodies: Body[],
  latStep = 1,
): ParansResult {
  const normalized = normalizeDateTime(datetime);
  const jdUt = toJulianDayUTC(normalized);
  const gst = siderealTimes(jdUt, 0).gst;

  const positions = bodies.map((b) => computeBodyPosition(jdUt, b, opts));
  const parans: Paran[] = [];

  for (let lat = -80; lat <= 80; lat += latStep) {
    const latRad = degToRad(lat);
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const p1 = positions[i];
        const p2 = positions[j];
        const h1 = hourAngleForHorizon(p1.dec, latRad);
        const h2 = hourAngleForHorizon(p2.dec, latRad);
        if (Number.isNaN(h1) || Number.isNaN(h2)) continue;
        const orb = Math.abs(radToDeg(h1 - h2));
        if (orb <= (opts.angularOrbDeg ?? 1)) {
          const angles: [Angle, Angle] = [angleFromHourAngle(h1), angleFromHourAngle(h2)];
          parans.push({
            latitude: lat,
            bodies: [p1.body, p2.body],
            angles,
            orbDeg: orb,
          });
        }
      }
    }
  }

  return { parans, version: VERSION };
}

function hourAngleForHorizon(decDeg: number, latRad: number): number {
  const decRad = degToRad(decDeg);
  const cosH = -Math.tan(latRad) * Math.tan(decRad);
  if (Math.abs(cosH) > 1) return Number.NaN;
  return Math.acos(cosH);
}

function angleFromHourAngle(h: number): Angle {
  // rising if H negative in time; we approximate with quadrant
  const deg = radToDeg(h);
  if (deg < 90) return 'ASC';
  if (deg > 90 && deg < 180) return 'MC';
  if (deg > 180 && deg < 270) return 'DSC';
  return 'IC';
}
