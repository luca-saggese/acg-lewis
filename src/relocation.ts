import swe from 'swisseph';
import type { CalculationOptions, Location, RelocationChartResult } from './types';
import { normalizeDateTime, siderealTimes, toJulianDayUTC } from './ephemeris';

const VERSION = '0.1.0';

const systems: Record<string, string> = {
  placidus: 'P',
  koch: 'K',
  equal: 'E',
  wholesign: 'W',
};

export function computeRelocationChart(
  datetime: Parameters<typeof normalizeDateTime>[0],
  location: Location,
  opts: CalculationOptions,
): RelocationChartResult {
  const normalized = normalizeDateTime(datetime);
  const jdUt = toJulianDayUTC(normalized);
  const angles = computeAngles(jdUt, location, opts);
  const houses: Record<string, number[]> = {};

  for (const [name, code] of Object.entries(systems)) {
    const res = swe.swe_houses_ex(jdUt, swe.SEFLG_SPEED, location.lat, location.lon, code) as any;
    if (res && Array.isArray(res.house)) {
      houses[name] = res.house;
    } else {
      houses[name] = [];
    }
  }

  return { location, houses, angles, version: VERSION };
}

function computeAngles(jdUt: number, location: Location, opts: CalculationOptions) {
  const st = siderealTimes(jdUt, location.lon);
  const res = swe.swe_houses_ex(jdUt, swe.SEFLG_SPEED, location.lat, location.lon, 'P') as any;
  const asc = res?.ascendant ?? 0;
  const mc = res?.mc ?? 0;
  const armc = res?.armc ?? 0;
  const vertex = res?.vertex ?? 0;
  const equasc = res?.equatorialAscendant ?? 0;
  return {
    ASC: asc,
    MC: mc,
    IC: (mc + 180) % 360,
    DSC: (asc + 180) % 360,
    ARM: armc,
    vertex,
    equasc,
    lst: st.lst,
  } as Record<'ASC' | 'MC' | 'IC' | 'DSC', number> & Record<string, number>;
}
