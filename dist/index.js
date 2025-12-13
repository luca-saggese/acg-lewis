// src/ephemeris.ts
import swe from "swisseph";
import { DateTime } from "luxon";

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
var fortuneCode = swe.SE_PART_FORTUNE ?? swe.SE_PFUND ?? swe.SE_MEAN_NODE;
var planetMap = {
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
  fortune: fortuneCode
};
var positionCache = /* @__PURE__ */ new Map();
function initEphemeris(config) {
  if (config?.ephemerisPath) {
    swe.swe_set_ephe_path(config.ephemerisPath);
  }
}
function buildFlags(opts, location) {
  let flags = swe.SEFLG_SPEED;
  if (opts.moonParallax) flags |= swe.SEFLG_TRUEPOS;
  if (opts.system === "sidereal") {
    flags |= swe.SEFLG_SIDEREAL;
    const aya = opts.ayanamsa ?? "lahiri";
    const ayaId = ayanamsaToConst(aya);
    swe.swe_set_sid_mode(ayaId, 0, 0);
  }
  if (location && typeof location.lat === "number" && typeof location.lon === "number") {
    flags |= swe.SEFLG_TOPOCTR;
    swe.swe_set_topo(location.lon, location.lat, location.alt ?? 0);
  }
  return flags;
}
function ayanamsaToConst(aya) {
  switch (aya) {
    case "lahiri":
      return swe.SE_SIDM_LAHIRI;
    case "krishnamurti":
      return swe.SE_SIDM_KRISHNAMURTI;
    case "raman":
      return swe.SE_SIDM_RAMAN;
    case "fagan_bradley":
      return swe.SE_SIDM_FAGAN_BRADLEY;
    case "yukteshwar":
      return swe.SE_SIDM_YUKTESHWAR;
    case "true_citra":
      return swe.SE_SIDM_TRUE_CITRA;
    case "user":
      return swe.SE_SIDM_USER;
    default:
      return swe.SE_SIDM_LAHIRI;
  }
}
function normalizeDateTime(input) {
  const second = input.second ?? 0;
  const zone = input.timezone ?? "UTC";
  const dt = DateTime.fromObject(
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
  const raw = swe.swe_sidtime(jdUt);
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
  const resultEcl = swe.swe_calc_ut(jdUt, target, flags);
  if (typeof resultEcl?.longitude !== "number") {
    throw new Error(`Swiss Ephemeris failed for ${JSON.stringify(body)}`);
  }
  const { longitude, latitude, distance } = {
    longitude: resultEcl.longitude,
    latitude: resultEcl.latitude,
    distance: resultEcl.distance
  };
  const eqFlags = flags | swe.SEFLG_EQUATORIAL;
  const resultEq = swe.swe_calc_ut(jdUt, target, eqFlags);
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
  const calFlag = dt.calendar === "julian" ? swe.SE_JUL_CAL : swe.SE_GREG_CAL;
  const res = swe.swe_utc_to_jd(dt.year, dt.month, dt.day, hour, minute, second, calFlag);
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
  const det = (a2.lon - a1.lon) * (b2.lat - b1.lat) - (a2.lat - a1.lat) * (b2.lon - b1.lon);
  if (Math.abs(det) < 1e-12) return null;
  const t = ((b1.lat - a1.lat) * (b2.lon - b1.lon) - (b1.lon - a1.lon) * (b2.lat - b1.lat)) / det;
  const u = ((b1.lat - a1.lat) * (a2.lon - a1.lon) - (b1.lon - a1.lon) * (a2.lat - a1.lat)) / det;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      lat: a1.lat + t * (a2.lat - a1.lat),
      lon: a1.lon + t * (a2.lon - a1.lon)
    };
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
            if (Math.abs(lat) < 85) {
              const classification = Math.abs(lat) > 75 ? "pseudo" : "real";
              crossings.push({ at: { lat, lon: meridianLon }, lines: [l1, l2], classification });
            }
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
            if (Math.abs(lat) < 85) {
              const classification = Math.abs(lat) > 75 ? "pseudo" : "real";
              crossings.push({ at: { lat, lon: meridianLon }, lines: [l1, l2], classification });
            }
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
            if (p && Math.abs(p.lat) < 85) {
              const classification = Math.abs(p.lat) > 75 ? "pseudo" : "real";
              crossings.push({ at: p, lines: [l1, l2], classification });
            }
          }
        }
      }
    }
  }
  return crossings.filter((p) => p.at.lat > -89.9 && p.at.lat < 89.9);
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
import swe2 from "swisseph";
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
    const res = swe2.swe_houses_ex(jdUt, swe2.SEFLG_SPEED, location.lat, location.lon, code);
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
  const res = swe2.swe_houses_ex(jdUt, swe2.SEFLG_SPEED, location.lat, location.lon, "P");
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
    if (closest <= radiusKm || radiusKm === -1) {
      const strength = classifyStrength(closest, geoOrb);
      const force = Math.exp(-closest / geoOrb);
      active.push({ body: line.body, angle: line.kind, distanceKm: closest, strength, force });
    }
  }
  const ranking = [...active].sort(
    (a, b) => compositeWeight(b) - compositeWeight(a)
  );
  const paransInArea = radiusKm === -1 ? parans : parans.filter((p) => Math.abs(p.latitude - city.lat) <= radiusKm / 111);
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
import { z } from "zod";
var CoordinateSchema = z.object({ lat: z.number(), lon: z.number() });
var BodySchema = z.union([
  z.literal("sun"),
  z.literal("moon"),
  z.literal("mercury"),
  z.literal("venus"),
  z.literal("mars"),
  z.literal("jupiter"),
  z.literal("saturn"),
  z.literal("uranus"),
  z.literal("neptune"),
  z.literal("pluto"),
  z.literal("true_node"),
  z.literal("mean_node"),
  z.literal("chiron"),
  z.literal("fortune"),
  z.object({ asteroid: z.number(), name: z.string().optional() })
]);
var BodyPositionSchema = z.object({
  body: BodySchema,
  jd: z.number(),
  ra: z.number(),
  dec: z.number(),
  eclipticLon: z.number(),
  eclipticLat: z.number(),
  distanceAU: z.number(),
  lst: z.number()
});
var CoordinateLineSchema = z.object({
  kind: z.enum(["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]),
  body: BodySchema,
  coordinates: z.array(CoordinateSchema),
  geojson: z.object({
    type: z.literal("Feature"),
    geometry: z.object({ type: z.literal("LineString"), coordinates: z.array(z.tuple([z.number(), z.number()])) }),
    properties: z.record(z.unknown()).optional()
  }).optional(),
  strength: z.enum(["strong", "medium", "weak"]).optional(),
  metadata: z.record(z.unknown()).optional()
});
var CrossingSchema = z.object({
  at: CoordinateSchema,
  lines: z.tuple([CoordinateLineSchema, CoordinateLineSchema]),
  classification: z.enum(["real", "pseudo"])
});
var ACGLinesResultSchema = z.object({
  timestamp: z.string(),
  gst: z.number(),
  bodies: z.array(BodyPositionSchema),
  lines: z.array(CoordinateLineSchema),
  crossings: z.array(CrossingSchema),
  version: z.string(),
  options: z.record(z.unknown())
});
var ParanSchema = z.object({
  latitude: z.number(),
  bodies: z.tuple([BodySchema, BodySchema]),
  angles: z.tuple([z.enum(["MC", "IC", "ASC", "DSC"]), z.enum(["MC", "IC", "ASC", "DSC"])]),
  orbDeg: z.number()
});
var ParansResultSchema = z.object({ parans: z.array(ParanSchema), version: z.string() });
var LocalSpaceLineSchema = z.object({
  body: BodySchema,
  bearing: z.number(),
  coordinates: z.array(CoordinateSchema)
});
var LocalSpaceResultSchema = z.object({
  origin: CoordinateSchema.extend({ alt: z.number().optional() }),
  lines: z.array(LocalSpaceLineSchema),
  version: z.string()
});
var LocationAnalysisItemSchema = z.object({
  body: BodySchema,
  angle: z.enum(["MC", "IC", "ASC", "DSC"]),
  distanceKm: z.number(),
  strength: z.enum(["strong", "medium", "weak"]),
  force: z.number()
});
var LocationAnalysisResultSchema = z.object({
  city: CoordinateSchema.extend({ alt: z.number().optional() }),
  radiusKm: z.number(),
  active: z.array(LocationAnalysisItemSchema),
  parans: z.array(ParanSchema),
  ranking: z.array(LocationAnalysisItemSchema),
  version: z.string()
});
var RelocationChartResultSchema = z.object({
  location: CoordinateSchema.extend({ alt: z.number().optional() }),
  houses: z.record(z.array(z.number())),
  angles: z.record(z.number()),
  version: z.string()
});
var Schemas = {
  ACGLinesResultSchema,
  ParansResultSchema,
  LocalSpaceResultSchema,
  LocationAnalysisResultSchema,
  RelocationChartResultSchema
};
export {
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
};
//# sourceMappingURL=index.js.map