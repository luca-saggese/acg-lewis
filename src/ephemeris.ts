import swe from 'swisseph';
import { DateTime } from 'luxon';
import { normalizeDeg, normalizeHour } from './utils';
import type { Body, BodyPosition, CalculationOptions, Location } from './types';

const fortuneCode = (swe as any).SE_PART_FORTUNE ?? (swe as any).SE_PFUND ?? swe.SE_MEAN_NODE;

const planetMap: Record<Exclude<Body, { asteroid: number; name?: string }>, number> = {
  sun: swe.SE_SUN,
  moon: swe.SE_MOON,
  mercury: swe.SE_MERCURY,
  venus: swe.SE_VENUS,
  mars: swe.SE_MARS,
  jupiter: swe.SE_JUPITER,
  saturn: swe.SE_SATURN,
  uranus: swe.SE_URANUS,
  neptune: swe.SE_NEPTUNE,
  pluto: swe.SE_PLUTO,
  true_node: swe.SE_TRUE_NODE,
  mean_node: swe.SE_MEAN_NODE,
  chiron: swe.SE_CHIRON,
  fortune: fortuneCode,
};

export type EphemerisConfig = {
  ephemerisPath?: string;
  useTopocentric?: boolean;
};

const positionCache = new Map<string, BodyPosition>();

export function initEphemeris(config?: EphemerisConfig) {
  if (config?.ephemerisPath) {
    swe.swe_set_ephe_path(config.ephemerisPath);
  }
}

function buildFlags(opts: CalculationOptions, location?: Location): number {
  let flags = swe.SEFLG_SPEED;
  if (opts.moonParallax) flags |= swe.SEFLG_TRUEPOS; // true position for Moon
  if (opts.system === 'sidereal') {
    flags |= swe.SEFLG_SIDEREAL;
    const aya = opts.ayanamsa ?? 'lahiri';
    const ayaId = ayanamsaToConst(aya);
    swe.swe_set_sid_mode(ayaId, 0, 0);
  }
  if (location && typeof location.lat === 'number' && typeof location.lon === 'number') {
    flags |= swe.SEFLG_TOPOCTR;
    swe.swe_set_topo(location.lon, location.lat, location.alt ?? 0);
  }
  return flags;
}

function ayanamsaToConst(aya: CalculationOptions['ayanamsa']): number {
  switch (aya) {
    case 'lahiri':
      return swe.SE_SIDM_LAHIRI;
    case 'krishnamurti':
      return swe.SE_SIDM_KRISHNAMURTI;
    case 'raman':
      return swe.SE_SIDM_RAMAN;
    case 'fagan_bradley':
      return swe.SE_SIDM_FAGAN_BRADLEY;
    case 'yukteshwar':
      return swe.SE_SIDM_YUKTESHWAR;
    case 'true_citra':
      return swe.SE_SIDM_TRUE_CITRA;
    case 'user':
      return swe.SE_SIDM_USER;
    default:
      return swe.SE_SIDM_LAHIRI;
  }
}

export type DateTimeInputNormalized = {
  year: number;
  month: number;
  day: number;
  hourDecimal: number;
  calendar: 'gregorian' | 'julian';
};

export function normalizeDateTime(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  timezone?: string;
  dstMinutes?: number;
  calendar?: 'gregorian' | 'julian';
}): DateTimeInputNormalized {
  const second = input.second ?? 0;
  const zone = input.timezone ?? 'UTC';
  const dt = DateTime.fromObject(
    {
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
      second,
    },
    { zone },
  ).minus({ minutes: input.dstMinutes ?? 0 }).toUTC();
  return {
    year: dt.year,
    month: dt.month,
    day: dt.day,
    hourDecimal: dt.hour + dt.minute / 60 + dt.second / 3600,
    calendar: input.calendar ?? 'gregorian',
  };
}

export function siderealTimes(jdUt: number, lon: number) {
  const raw = swe.swe_sidtime(jdUt) as any;
  const gstVal = typeof raw === 'number' ? raw : raw?.siderialTime;
  const gst = normalizeHour(gstVal ?? 0);
  const lst = normalizeHour(gst + lon / 15);
  return { gst, lst };
}

export function computeBodyPosition(
  jdUt: number,
  body: Body,
  opts: CalculationOptions,
  location?: Location,
): BodyPosition {
  const cacheKey = `${jdUt}-${JSON.stringify(body)}-${JSON.stringify(opts)}-${location?.lat ?? ''}-${location?.lon ?? ''}`;
  if (opts.cache && positionCache.has(cacheKey)) {
    return positionCache.get(cacheKey)!;
  }
  const flags = buildFlags(opts, location);
  const target = typeof body === 'string' ? planetMap[body] : body.asteroid;
  const resultEcl = swe.swe_calc_ut(jdUt, target, flags) as any;
  if (typeof resultEcl?.longitude !== 'number') {
    throw new Error(`Swiss Ephemeris failed for ${JSON.stringify(body)}`);
  }
  const { longitude, latitude, distance } = {
    longitude: resultEcl.longitude,
    latitude: resultEcl.latitude,
    distance: resultEcl.distance,
  };
  const eqFlags = flags | swe.SEFLG_EQUATORIAL;
  const resultEq = swe.swe_calc_ut(jdUt, target, eqFlags) as any;
  const raDeg =
    typeof resultEq?.rectAscension === 'number'
      ? resultEq.rectAscension
      : typeof resultEq?.longitude === 'number'
        ? resultEq.longitude
        : null;
  const decDeg =
    typeof resultEq?.declination === 'number'
      ? resultEq.declination
      : typeof resultEq?.latitude === 'number'
        ? resultEq.latitude
        : null;
  if (raDeg === null || decDeg === null) {
    throw new Error(`Swiss Ephemeris equatorial output missing RA/DEC for ${JSON.stringify(body)}`);
  }
  const ra = raDeg / 15;
  const dec = decDeg;
  const position: BodyPosition = {
    body,
    jd: jdUt,
    ra: normalizeHour(ra),
    dec,
    eclipticLon: normalizeDeg(longitude),
    eclipticLat: latitude,
    distanceAU: distance,
    lst: 0,
  };
  if (opts.cache) positionCache.set(cacheKey, position);
  return position;
}

export function attachLst(position: BodyPosition, lst: number): BodyPosition {
  return { ...position, lst: normalizeHour(lst) };
}

export function toJulianDayUTC(dt: DateTimeInputNormalized): number {
  const hour = Math.floor(dt.hourDecimal);
  const minuteDecimal = (dt.hourDecimal - hour) * 60;
  const minute = Math.floor(minuteDecimal);
  const second = (minuteDecimal - minute) * 60;
  const calFlag = dt.calendar === 'julian' ? swe.SE_JUL_CAL : swe.SE_GREG_CAL;
  const res = swe.swe_utc_to_jd(dt.year, dt.month, dt.day, hour, minute, second, calFlag);
  if ((res as any).error) {
    throw new Error(`swe_utc_to_jd failed: ${(res as any).error}`);
  }
  const jdUt = (res as any).julianDayUT ?? (res as any).julday_ut ?? (res as any).julday;
  return jdUt;
}
