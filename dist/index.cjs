"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ACGLinesResultSchema: () => ACGLinesResultSchema,
  BodyPositionSchema: () => BodyPositionSchema,
  BodySchema: () => BodySchema,
  CoordinateLineSchema: () => CoordinateLineSchema,
  CoordinateSchema: () => CoordinateSchema,
  CrossingSchema: () => CrossingSchema,
  LocalSpaceLineSchema: () => LocalSpaceLineSchema,
  LocalSpaceResultSchema: () => LocalSpaceResultSchema,
  LocationAnalysisItemSchema: () => LocationAnalysisItemSchema,
  LocationAnalysisResultSchema: () => LocationAnalysisResultSchema,
  ParanSchema: () => ParanSchema,
  ParansResultSchema: () => ParansResultSchema,
  RelocationChartResultSchema: () => RelocationChartResultSchema,
  Schemas: () => Schemas,
  analyzeLocation: () => analyzeLocation,
  computeACG: () => computeACG,
  computeLocalSpace: () => computeLocalSpace,
  computeParans: () => computeParans,
  computeRelocationChart: () => computeRelocationChart,
  initEphemeris: () => initEphemeris
});
module.exports = __toCommonJS(index_exports);

// src/ephemeris.ts
var import_swisseph = __toESM(require("swisseph"), 1);
var import_luxon = require("luxon");

// src/utils.ts
var DEG2RAD = Math.PI / 180;
var RAD2DEG = 180 / Math.PI;
function degToRad(deg) {
  return deg * DEG2RAD;
}
function radToDeg(rad) {
  return rad * RAD2DEG;
}
function normalizeDeg(deg) {
  const res = (deg % 360 + 360) % 360;
  return res === 360 ? 0 : res;
}
function normalizeHour(hours) {
  const res = (hours % 24 + 24) % 24;
  return res === 24 ? 0 : res;
}
function clampLat(lat) {
  return Math.max(-89.999, Math.min(89.999, lat));
}
function haversineKm(a, b) {
  const R = 6371;
  const dLat = degToRad(b.lat - a.lat);
  const dLon = degToRad(b.lon - a.lon);
  const lat1 = degToRad(a.lat);
  const lat2 = degToRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
function pointSegmentDistanceKm(p, a, b) {
  const R = 6371;
  const \u03C61 = degToRad(a.lat);
  const \u03BB1 = degToRad(a.lon);
  const \u03C62 = degToRad(b.lat);
  const \u03BB2 = degToRad(b.lon);
  const \u03C6p = degToRad(p.lat);
  const \u03BBp = degToRad(p.lon);
  const d13 = haversineKm(a, p) / R;
  const \u03B813 = bearingRad(a, p);
  const \u03B812 = bearingRad(a, b);
  const dXt = Math.asin(Math.sin(d13) * Math.sin(\u03B813 - \u03B812));
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
function bearingRad(a, b) {
  const \u03C61 = degToRad(a.lat);
  const \u03C62 = degToRad(b.lat);
  const \u0394\u03BB = degToRad(b.lon - a.lon);
  const y = Math.sin(\u0394\u03BB) * Math.cos(\u03C62);
  const x = Math.cos(\u03C61) * Math.sin(\u03C62) - Math.sin(\u03C61) * Math.cos(\u03C62) * Math.cos(\u0394\u03BB);
  return Math.atan2(y, x);
}
function toGeoJSONLineString(coords, properties) {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: coords.map((c) => [normalizeLon(c.lon), c.lat])
    },
    properties
  };
}
function normalizeLon(lon) {
  const res = ((lon + 180) % 360 + 360) % 360 - 180;
  return res;
}
function classifyStrength(distanceKm, geoOrbKm) {
  if (distanceKm <= geoOrbKm * 0.33) return "strong";
  if (distanceKm <= geoOrbKm * 0.66) return "medium";
  return "weak";
}
function interpolateGreatCircle(start, bearingDeg, distanceKm, stepKm = 50) {
  const R = 6371;
  const brng = degToRad(bearingDeg);
  const coords = [];
  const steps = Math.max(2, Math.ceil(distanceKm / stepKm));
  for (let i = 0; i <= steps; i++) {
    const d = distanceKm * i / steps;
    const angDist = d / R;
    const lat1 = degToRad(start.lat);
    const lon1 = degToRad(start.lon);
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angDist) + Math.cos(lat1) * Math.sin(angDist) * Math.cos(brng)
    );
    const lon2 = lon1 + Math.atan2(
      Math.sin(brng) * Math.sin(angDist) * Math.cos(lat1),
      Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2)
    );
    coords.push({ lat: radToDeg(lat2), lon: normalizeLon(radToDeg(lon2)) });
  }
  return coords;
}

// src/ephemeris.ts
var fortuneCode = import_swisseph.default.SE_PART_FORTUNE ?? import_swisseph.default.SE_PFUND ?? import_swisseph.default.SE_MEAN_NODE;
var planetMap = {
  sun: import_swisseph.default.SE_SUN,
  moon: import_swisseph.default.SE_MOON,
  mercury: import_swisseph.default.SE_MERCURY,
  venus: import_swisseph.default.SE_VENUS,
  mars: import_swisseph.default.SE_MARS,
  jupiter: import_swisseph.default.SE_JUPITER,
  saturn: import_swisseph.default.SE_SATURN,
  uranus: import_swisseph.default.SE_URANUS,
  neptune: import_swisseph.default.SE_NEPTUNE,
  pluto: import_swisseph.default.SE_PLUTO,
  true_node: import_swisseph.default.SE_TRUE_NODE,
  mean_node: import_swisseph.default.SE_MEAN_NODE,
  chiron: import_swisseph.default.SE_CHIRON,
  fortune: fortuneCode
};
var positionCache = /* @__PURE__ */ new Map();
function initEphemeris(config) {
  if (config?.ephemerisPath) {
    import_swisseph.default.swe_set_ephe_path(config.ephemerisPath);
  }
}
function buildFlags(opts, location) {
  let flags = import_swisseph.default.SEFLG_SPEED;
  if (opts.moonParallax) flags |= import_swisseph.default.SEFLG_TRUEPOS;
  if (opts.system === "sidereal") {
    flags |= import_swisseph.default.SEFLG_SIDEREAL;
    const aya = opts.ayanamsa ?? "lahiri";
    const ayaId = ayanamsaToConst(aya);
    import_swisseph.default.swe_set_sid_mode(ayaId, 0, 0);
  }
  if (location && typeof location.lat === "number" && typeof location.lon === "number") {
    flags |= import_swisseph.default.SEFLG_TOPOCTR;
    import_swisseph.default.swe_set_topo(location.lon, location.lat, location.alt ?? 0);
  }
  return flags;
}
function ayanamsaToConst(aya) {
  switch (aya) {
    case "lahiri":
      return import_swisseph.default.SE_SIDM_LAHIRI;
    case "krishnamurti":
      return import_swisseph.default.SE_SIDM_KRISHNAMURTI;
    case "raman":
      return import_swisseph.default.SE_SIDM_RAMAN;
    case "fagan_bradley":
      return import_swisseph.default.SE_SIDM_FAGAN_BRADLEY;
    case "yukteshwar":
      return import_swisseph.default.SE_SIDM_YUKTESHWAR;
    case "true_citra":
      return import_swisseph.default.SE_SIDM_TRUE_CITRA;
    case "user":
      return import_swisseph.default.SE_SIDM_USER;
    default:
      return import_swisseph.default.SE_SIDM_LAHIRI;
  }
}
function normalizeDateTime(input) {
  const second = input.second ?? 0;
  const zone = input.timezone ?? "UTC";
  const dt = import_luxon.DateTime.fromObject(
    {
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
      second
    },
    { zone }
  ).minus({ minutes: input.dstMinutes ?? 0 }).toUTC();
  return {
    year: dt.year,
    month: dt.month,
    day: dt.day,
    hourDecimal: dt.hour + dt.minute / 60 + dt.second / 3600,
    calendar: input.calendar ?? "gregorian"
  };
}
function siderealTimes(jdUt, lon) {
  const raw = import_swisseph.default.swe_sidtime(jdUt);
  const gstVal = typeof raw === "number" ? raw : raw?.siderialTime;
  const gst = normalizeHour(gstVal ?? 0);
  const lst = normalizeHour(gst + lon / 15);
  return { gst, lst };
}
function computeBodyPosition(jdUt, body, opts, location) {
  const cacheKey = `${jdUt}-${JSON.stringify(body)}-${JSON.stringify(opts)}-${location?.lat ?? ""}-${location?.lon ?? ""}`;
  if (opts.cache && positionCache.has(cacheKey)) {
    return positionCache.get(cacheKey);
  }
  const flags = buildFlags(opts, location);
  const target = typeof body === "string" ? planetMap[body] : body.asteroid;
  const resultEcl = import_swisseph.default.swe_calc_ut(jdUt, target, flags);
  if (typeof resultEcl?.longitude !== "number") {
    throw new Error(`Swiss Ephemeris failed for ${JSON.stringify(body)}`);
  }
  const { longitude, latitude, distance } = {
    longitude: resultEcl.longitude,
    latitude: resultEcl.latitude,
    distance: resultEcl.distance
  };
  const eqFlags = flags | import_swisseph.default.SEFLG_EQUATORIAL;
  const resultEq = import_swisseph.default.swe_calc_ut(jdUt, target, eqFlags);
  const raDeg = typeof resultEq?.rectAscension === "number" ? resultEq.rectAscension : typeof resultEq?.longitude === "number" ? resultEq.longitude : null;
  const decDeg = typeof resultEq?.declination === "number" ? resultEq.declination : typeof resultEq?.latitude === "number" ? resultEq.latitude : null;
  if (raDeg === null || decDeg === null) {
    throw new Error(`Swiss Ephemeris equatorial output missing RA/DEC for ${JSON.stringify(body)}`);
  }
  const ra = raDeg / 15;
  const dec = decDeg;
  const position = {
    body,
    jd: jdUt,
    ra: normalizeHour(ra),
    dec,
    eclipticLon: normalizeDeg(longitude),
    eclipticLat: latitude,
    distanceAU: distance,
    lst: 0
  };
  if (opts.cache) positionCache.set(cacheKey, position);
  return position;
}
function attachLst(position, lst) {
  return { ...position, lst: normalizeHour(lst) };
}
function toJulianDayUTC(dt) {
  const hour = Math.floor(dt.hourDecimal);
  const minuteDecimal = (dt.hourDecimal - hour) * 60;
  const minute = Math.floor(minuteDecimal);
  const second = (minuteDecimal - minute) * 60;
  const calFlag = dt.calendar === "julian" ? import_swisseph.default.SE_JUL_CAL : import_swisseph.default.SE_GREG_CAL;
  const res = import_swisseph.default.swe_utc_to_jd(dt.year, dt.month, dt.day, hour, minute, second, calFlag);
  if (res.error) {
    throw new Error(`swe_utc_to_jd failed: ${res.error}`);
  }
  const jdUt = res.julianDayUT ?? res.julday_ut ?? res.julday;
  return jdUt;
}

// src/acg.ts
var VERSION = "0.1.0";
function computeACG(datetime, opts, bodies, baseLocation) {
  const normalized = normalizeDateTime(datetime);
  const jdUt = toJulianDayUTC(normalized);
  if (opts.ephemerisPath) {
  }
  const gst = siderealTimes(jdUt, 0).gst;
  const lines = [];
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
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    gst,
    bodies: positions,
    lines,
    crossings,
    version: VERSION,
    options: opts
  };
}
function buildAngularLines(pos, gst, opts) {
  const mcLon = normalizeLon((pos.ra - gst) * 15);
  const icLon = normalizeLon((pos.ra + 12 - gst) * 15);
  const mc = {
    kind: "MC",
    body: pos.body,
    coordinates: [
      { lat: 89.999, lon: mcLon },
      { lat: -89.999, lon: mcLon }
    ],
    geojson: toGeoJSONLineString([
      { lat: 89.999, lon: mcLon },
      { lat: -89.999, lon: mcLon }
    ])
  };
  const ic = {
    kind: "IC",
    body: pos.body,
    coordinates: [
      { lat: 89.999, lon: icLon },
      { lat: -89.999, lon: icLon }
    ],
    geojson: toGeoJSONLineString([
      { lat: 89.999, lon: icLon },
      { lat: -89.999, lon: icLon }
    ])
  };
  const ascLine = buildAscDscCurve(pos, gst, "ASC", opts);
  const dscLine = buildAscDscCurve(pos, gst, "DSC", opts);
  return [mc, ic, ascLine, dscLine];
}
function buildAscDscCurve(pos, gst, angle, opts) {
  const step = opts.samplingStepDeg ?? 2;
  const allPoints = [];
  const altOffset = opts.refractAscDsc ? degToRad(-0.5667) : 0;
  for (let lon = -180; lon <= 180; lon += step) {
    const lst = normalizeHour(gst + lon / 15);
    const H = degToRad((lst - pos.ra) * 15);
    const decRad = degToRad(pos.dec);
    const tanLat = -Math.cos(decRad) * Math.cos(H) / Math.sin(decRad);
    let latRad = Math.atan(tanLat);
    const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(H);
    if (Math.abs(sinAlt) > 0.1) {
      latRad = latRad > 0 ? latRad - Math.PI : latRad + Math.PI;
    }
    if (opts.refractAscDsc) {
      latRad = solveLatitudeForAltitude(decRad, H, altOffset, latRad);
    }
    let lat = radToDeg(latRad);
    lat = clampLat(lat);
    allPoints.push({ lat, lon: normalizeLon(lon), H });
  }
  const wantSign = angle === "ASC" ? -1 : 1;
  const filtered = allPoints.filter((pt) => {
    const currentSign = Math.sin(pt.H) < 0 ? -1 : 1;
    return currentSign === wantSign;
  });
  const segments = [];
  let currentSegment = [];
  for (let i = 0; i < filtered.length; i++) {
    const pt = filtered[i];
    if (currentSegment.length > 0) {
      const prev = currentSegment[currentSegment.length - 1];
      const lonJump = Math.abs(pt.lon - prev.lon);
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
  const coords = segments.length > 0 ? segments.reduce((a, b) => a.length > b.length ? a : b, []) : [];
  return {
    kind: angle,
    body: pos.body,
    coordinates: coords,
    geojson: toGeoJSONLineString(coords)
  };
}
function apparentAltitude(latRad, decRad, H) {
  return Math.asin(Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(H));
}
function solveLatitudeForAltitude(decRad, H, targetAlt, initialLat) {
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
function segmentsIntersect(a1, a2, b1, b2) {
  const samples = 20;
  let minDist = Infinity;
  let bestPt = null;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const ptA = {
      lat: a1.lat + t * (a2.lat - a1.lat),
      lon: a1.lon + t * (a2.lon - a1.lon)
    };
    for (let j = 0; j <= samples; j++) {
      const u = j / samples;
      const ptB = {
        lat: b1.lat + u * (b2.lat - b1.lat),
        lon: b1.lon + u * (b2.lon - b1.lon)
      };
      const d = haversineKm(ptA, ptB);
      if (d < minDist) {
        minDist = d;
        bestPt = { lat: (ptA.lat + ptB.lat) / 2, lon: (ptA.lon + ptB.lon) / 2 };
      }
    }
  }
  if (minDist < 50) {
    return bestPt;
  }
  return null;
}
function findCrossings(lines) {
  const crossings = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const l1 = lines[i];
      const l2 = lines[j];
      if ((l1.kind === "MC" || l1.kind === "IC") && (l2.kind === "ASC" || l2.kind === "DSC")) {
        const meridianLon = l1.coordinates[0].lon;
        for (let k = 0; k < l2.coordinates.length - 1; k++) {
          const p1 = l2.coordinates[k];
          const p2 = l2.coordinates[k + 1];
          const lonMin = Math.min(p1.lon, p2.lon);
          const lonMax = Math.max(p1.lon, p2.lon);
          if (meridianLon >= lonMin && meridianLon <= lonMax) {
            const t = (meridianLon - p1.lon) / (p2.lon - p1.lon);
            const lat = p1.lat + t * (p2.lat - p1.lat);
            const classification = Math.abs(lat) > 85 ? "pseudo" : "real";
            crossings.push({ at: { lat, lon: meridianLon }, lines: [l1, l2], classification });
            break;
          }
        }
      } else if ((l2.kind === "MC" || l2.kind === "IC") && (l1.kind === "ASC" || l1.kind === "DSC")) {
        const meridianLon = l2.coordinates[0].lon;
        for (let k = 0; k < l1.coordinates.length - 1; k++) {
          const p1 = l1.coordinates[k];
          const p2 = l1.coordinates[k + 1];
          const lonMin = Math.min(p1.lon, p2.lon);
          const lonMax = Math.max(p1.lon, p2.lon);
          if (meridianLon >= lonMin && meridianLon <= lonMax) {
            const t = (meridianLon - p1.lon) / (p2.lon - p1.lon);
            const lat = p1.lat + t * (p2.lat - p1.lat);
            const classification = Math.abs(lat) > 85 ? "pseudo" : "real";
            crossings.push({ at: { lat, lon: meridianLon }, lines: [l1, l2], classification });
            break;
          }
        }
      } else {
        for (let s1 = 0; s1 < l1.coordinates.length - 1; s1++) {
          for (let s2 = 0; s2 < l2.coordinates.length - 1; s2++) {
            const p = segmentsIntersect(
              l1.coordinates[s1],
              l1.coordinates[s1 + 1],
              l2.coordinates[s2],
              l2.coordinates[s2 + 1]
            );
            if (p) {
              const classification = Math.abs(p.lat) > 85 ? "pseudo" : "real";
              crossings.push({ at: p, lines: [l1, l2], classification });
            }
          }
        }
      }
    }
  }
  return crossings;
}

// src/parans.ts
var VERSION2 = "0.1.0";
function computeParans(datetime, opts, bodies, latStep = 1) {
  const normalized = normalizeDateTime(datetime);
  const jdUt = toJulianDayUTC(normalized);
  const gst = siderealTimes(jdUt, 0).gst;
  const positions = bodies.map((b) => computeBodyPosition(jdUt, b, opts));
  const parans = [];
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
          const angles = [angleFromHourAngle(h1), angleFromHourAngle(h2)];
          parans.push({
            latitude: lat,
            bodies: [p1.body, p2.body],
            angles,
            orbDeg: orb
          });
        }
      }
    }
  }
  return { parans, version: VERSION2 };
}
function hourAngleForHorizon(decDeg, latRad) {
  const decRad = degToRad(decDeg);
  const cosH = -Math.tan(latRad) * Math.tan(decRad);
  if (Math.abs(cosH) > 1) return Number.NaN;
  return Math.acos(cosH);
}
function angleFromHourAngle(h) {
  const deg = radToDeg(h);
  if (deg < 90) return "ASC";
  if (deg > 90 && deg < 180) return "MC";
  if (deg > 180 && deg < 270) return "DSC";
  return "IC";
}

// src/localSpace.ts
var VERSION3 = "0.1.0";
function computeLocalSpace(datetime, origin, opts, bodies) {
  const normalized = normalizeDateTime(datetime);
  const jdUt = toJulianDayUTC(normalized);
  const lst = siderealTimes(jdUt, origin.lon).lst;
  const lines = [];
  for (const body of bodies) {
    const pos = computeBodyPosition(jdUt, body, opts, origin);
    const az = azimuth(pos.ra, pos.dec, lst, origin.lat);
    const coords = interpolateGreatCircle(origin, az, 2e4, 100);
    lines.push({ body, bearing: az, coordinates: coords });
  }
  return { origin, lines, version: VERSION3 };
}
function azimuth(raHours, decDeg, lstHours, latDeg) {
  const H = degToRad((lstHours - raHours) * 15);
  const dec = degToRad(decDeg);
  const lat = degToRad(latDeg);
  const y = Math.sin(H);
  const x = Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat);
  let az = radToDeg(Math.atan2(y, x));
  az = normalizeLon(az + 180);
  return az;
}

// src/relocation.ts
var import_swisseph2 = __toESM(require("swisseph"), 1);
var VERSION4 = "0.1.0";
var systems = {
  placidus: "P",
  koch: "K",
  equal: "E",
  wholesign: "W"
};
function computeRelocationChart(datetime, location, opts) {
  const normalized = normalizeDateTime(datetime);
  const jdUt = toJulianDayUTC(normalized);
  const angles = computeAngles(jdUt, location, opts);
  const houses = {};
  for (const [name, code] of Object.entries(systems)) {
    const res = import_swisseph2.default.swe_houses_ex(jdUt, import_swisseph2.default.SEFLG_SPEED, location.lat, location.lon, code);
    if (res && Array.isArray(res.house)) {
      houses[name] = res.house;
    } else {
      houses[name] = [];
    }
  }
  return { location, houses, angles, version: VERSION4 };
}
function computeAngles(jdUt, location, opts) {
  const st = siderealTimes(jdUt, location.lon);
  const res = import_swisseph2.default.swe_houses_ex(jdUt, import_swisseph2.default.SEFLG_SPEED, location.lat, location.lon, "P");
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
    lst: st.lst
  };
}

// src/analyze.ts
var VERSION5 = "0.1.0";
function analyzeLocation(city, radiusKm, acg, parans, opts) {
  const geoOrb = opts.geoOrbKm ?? 300;
  const active = [];
  for (const line of acg.lines) {
    const closest = minDistanceToLine(city, line.coordinates);
    if (closest <= radiusKm) {
      const strength = classifyStrength(closest, geoOrb);
      const force = Math.exp(-closest / geoOrb);
      active.push({ body: line.body, angle: line.kind, distanceKm: closest, strength, force });
    }
  }
  const ranking = [...active].sort(
    (a, b) => compositeWeight(b) - compositeWeight(a)
  );
  const paransInArea = parans.filter((p) => Math.abs(p.latitude - city.lat) <= radiusKm / 111);
  return { city, radiusKm, active, parans: paransInArea, ranking, version: VERSION5 };
}
function minDistanceToLine(point, coords) {
  if (coords.length === 0) return Number.POSITIVE_INFINITY;
  if (coords.length === 1) return haversineKm(point, coords[0]);
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointSegmentDistanceKm(point, coords[i], coords[i + 1]);
    if (d < min) min = d;
  }
  return min;
}
function strengthWeight(s) {
  switch (s) {
    case "strong":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}
function anglePriority(angle) {
  if (angle === "MC" || angle === "ASC") return 2;
  return 1;
}
function compositeWeight(item) {
  return strengthWeight(item.strength) * anglePriority(item.angle) * bodyPriority(item.body) * item.force;
}
function bodyPriority(body) {
  if (typeof body !== "string") return 1;
  const personal = ["sun", "moon", "mercury", "venus", "mars"];
  const social = ["jupiter", "saturn"];
  if (personal.includes(body)) return 1.3;
  if (social.includes(body)) return 1.1;
  return 1;
}

// src/schema.ts
var import_zod = require("zod");
var CoordinateSchema = import_zod.z.object({ lat: import_zod.z.number(), lon: import_zod.z.number() });
var BodySchema = import_zod.z.union([
  import_zod.z.literal("sun"),
  import_zod.z.literal("moon"),
  import_zod.z.literal("mercury"),
  import_zod.z.literal("venus"),
  import_zod.z.literal("mars"),
  import_zod.z.literal("jupiter"),
  import_zod.z.literal("saturn"),
  import_zod.z.literal("uranus"),
  import_zod.z.literal("neptune"),
  import_zod.z.literal("pluto"),
  import_zod.z.literal("true_node"),
  import_zod.z.literal("mean_node"),
  import_zod.z.literal("chiron"),
  import_zod.z.literal("fortune"),
  import_zod.z.object({ asteroid: import_zod.z.number(), name: import_zod.z.string().optional() })
]);
var BodyPositionSchema = import_zod.z.object({
  body: BodySchema,
  jd: import_zod.z.number(),
  ra: import_zod.z.number(),
  dec: import_zod.z.number(),
  eclipticLon: import_zod.z.number(),
  eclipticLat: import_zod.z.number(),
  distanceAU: import_zod.z.number(),
  lst: import_zod.z.number()
});
var CoordinateLineSchema = import_zod.z.object({
  kind: import_zod.z.enum(["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]),
  body: BodySchema,
  coordinates: import_zod.z.array(CoordinateSchema),
  geojson: import_zod.z.object({
    type: import_zod.z.literal("Feature"),
    geometry: import_zod.z.object({ type: import_zod.z.literal("LineString"), coordinates: import_zod.z.array(import_zod.z.tuple([import_zod.z.number(), import_zod.z.number()])) }),
    properties: import_zod.z.record(import_zod.z.unknown()).optional()
  }).optional(),
  strength: import_zod.z.enum(["strong", "medium", "weak"]).optional(),
  metadata: import_zod.z.record(import_zod.z.unknown()).optional()
});
var CrossingSchema = import_zod.z.object({
  at: CoordinateSchema,
  lines: import_zod.z.tuple([CoordinateLineSchema, CoordinateLineSchema]),
  classification: import_zod.z.enum(["real", "pseudo"])
});
var ACGLinesResultSchema = import_zod.z.object({
  timestamp: import_zod.z.string(),
  gst: import_zod.z.number(),
  bodies: import_zod.z.array(BodyPositionSchema),
  lines: import_zod.z.array(CoordinateLineSchema),
  crossings: import_zod.z.array(CrossingSchema),
  version: import_zod.z.string(),
  options: import_zod.z.record(import_zod.z.unknown())
});
var ParanSchema = import_zod.z.object({
  latitude: import_zod.z.number(),
  bodies: import_zod.z.tuple([BodySchema, BodySchema]),
  angles: import_zod.z.tuple([import_zod.z.enum(["MC", "IC", "ASC", "DSC"]), import_zod.z.enum(["MC", "IC", "ASC", "DSC"])]),
  orbDeg: import_zod.z.number()
});
var ParansResultSchema = import_zod.z.object({ parans: import_zod.z.array(ParanSchema), version: import_zod.z.string() });
var LocalSpaceLineSchema = import_zod.z.object({
  body: BodySchema,
  bearing: import_zod.z.number(),
  coordinates: import_zod.z.array(CoordinateSchema)
});
var LocalSpaceResultSchema = import_zod.z.object({
  origin: CoordinateSchema.extend({ alt: import_zod.z.number().optional() }),
  lines: import_zod.z.array(LocalSpaceLineSchema),
  version: import_zod.z.string()
});
var LocationAnalysisItemSchema = import_zod.z.object({
  body: BodySchema,
  angle: import_zod.z.enum(["MC", "IC", "ASC", "DSC"]),
  distanceKm: import_zod.z.number(),
  strength: import_zod.z.enum(["strong", "medium", "weak"]),
  force: import_zod.z.number()
});
var LocationAnalysisResultSchema = import_zod.z.object({
  city: CoordinateSchema.extend({ alt: import_zod.z.number().optional() }),
  radiusKm: import_zod.z.number(),
  active: import_zod.z.array(LocationAnalysisItemSchema),
  parans: import_zod.z.array(ParanSchema),
  ranking: import_zod.z.array(LocationAnalysisItemSchema),
  version: import_zod.z.string()
});
var RelocationChartResultSchema = import_zod.z.object({
  location: CoordinateSchema.extend({ alt: import_zod.z.number().optional() }),
  houses: import_zod.z.record(import_zod.z.array(import_zod.z.number())),
  angles: import_zod.z.record(import_zod.z.number()),
  version: import_zod.z.string()
});
var Schemas = {
  ACGLinesResultSchema,
  ParansResultSchema,
  LocalSpaceResultSchema,
  LocationAnalysisResultSchema,
  RelocationChartResultSchema
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ACGLinesResultSchema,
  BodyPositionSchema,
  BodySchema,
  CoordinateLineSchema,
  CoordinateSchema,
  CrossingSchema,
  LocalSpaceLineSchema,
  LocalSpaceResultSchema,
  LocationAnalysisItemSchema,
  LocationAnalysisResultSchema,
  ParanSchema,
  ParansResultSchema,
  RelocationChartResultSchema,
  Schemas,
  analyzeLocation,
  computeACG,
  computeLocalSpace,
  computeParans,
  computeRelocationChart,
  initEphemeris
});
//# sourceMappingURL=index.cjs.map