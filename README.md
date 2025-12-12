# acg-lewis

Astronomically-correct Astro*Carto*Graphy calculations (Jim Lewis style) using Swiss Ephemeris. Map-agnostic: only structured data outputs (JSON, GeoJSON-ready).

## Features
- Swiss Ephemeris (equatorial, topocentric, true positions) with tropical/sidereal (ayanamsa selectable)
- Core outputs: RA/DEC, ecliptic lon/lat, distance, GST/LST
- ACG lines: MC/IC (vertical), ASC/DSC (curves with refraction option), GeoJSON-ready, crossings detection
- Parans detection (planet-planet, angle-angle) with configurable orb
- Local Space great-circle directions
- Relocation charts with multiple house systems (Placidus, Koch, Equal, Whole Sign)
- Location analysis: active lines near a city, strength ranking (Lewis priorities + personal/transpersonal weighting), parans nearby, force decay
- Configurable orbs, sampling step, refraction/parallax flags (Moon true position), julian/gregorian calendars
- JSON Schemas (Zod) exported for validation (`src/schema.ts`)

## Install
```bash
npm install acg-lewis swisseph luxon
```

> Swiss Ephemeris requires ephemeris data files; set `ephemerisPath` to your `.se1` directory or rely on builtin if available.

## Quick start
```ts
import { computeACG, computeParans, computeLocalSpace, computeRelocationChart, analyzeLocation } from 'acg-lewis';

const datetime = { year: 1990, month: 1, day: 1, hour: 12, minute: 0, timezone: 'UTC' };
const bodies = ['sun', 'moon', 'mercury', 'venus', 'mars'] as const;
const opts = { system: 'tropical', angularOrbDeg: 1, samplingStepDeg: 2, geoOrbKm: 300, cache: true };

const acg = computeACG(datetime, opts, bodies);
const parans = computeParans(datetime, opts, bodies, 2);
const ls = computeLocalSpace(datetime, { lat: 40, lon: -3, alt: 0 }, opts, bodies);
const relocation = computeRelocationChart(datetime, { lat: 40, lon: -3, alt: 0 }, opts);
const analysis = analyzeLocation({ lat: 40, lon: -3, alt: 0 }, 500, acg, parans.parans, opts);

// Validate against schema if needed
// import { ACGLinesResultSchema } from 'acg-lewis';
// ACGLinesResultSchema.parse(acg);
```

## Options
- `system`: `tropical` | `sidereal`
- `ayanamsa`: one of Lahiri/Krishnamurti/Raman/Fagan Bradley/Yukteshwar/True Citra/User
- `angularOrbDeg`: orb for parans / angular hits (deg)
- `geoOrbKm`: width for geographic influence classification
- `samplingStepDeg`: grid step for ASC/DSC
- `refractAscDsc`: toggle refraction correction (stub hook)
- `moonParallax`: use true position for Moon
- `ephemerisPath`: directory containing Swiss ephemeris files
- `cache`: memoize planetary positions per JD

## Validation targets
- Compare outputs against Solar Fire / AstroDienst
- Stress tests: polar latitudes, Moon parallax, complex DST transitions, julian calendar

## Notes
- Crossing lines detection uses geometric segment intersections (real) and proximity (pseudo) classification; refine tolerance as desired.
- For production accuracy, ship Swiss ephemeris `.se1` data and set `ephemerisPath`.

## Glossario breve (stile Lewis)
- MC/IC/ASC/DSC: angoli primari; priorità MC≈ASC > DSC≈IC.
- Parans: simultanea angularità di due corpi a latitudine data; orb angolare configurabile.
- Crossing lines: intersezioni matematiche tra linee angolari (non parans).
- Local Space: grande cerchio dal luogo natale lungo l’azimut del corpo.
- Orb geografico: distanza laterale dalla linea; forza decresce con exp(-d/orbKm).

## License
ISC
