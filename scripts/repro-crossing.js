
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeACG } from '../dist/index.js';

const datetime = {
  year: 1974,
  month: 8,
  day: 12,
  hour: 9,
  minute: 0,
  timezone: 'Europe/Rome',
};

const location = { lat: 42, lon: 12, alt: 0 };
const bodies = ['sun', 'moon', 'mercury', 'venus', 'mars'];

const options = {
  system: 'tropical',
  angularOrbDeg: 1,
  samplingStepDeg: 1,
  geoOrbKm: 300,
  cache: true,
};

const acg = computeACG(datetime, options, bodies, location);

// For each crossing, compute distance from crossing point to both lines
function haversineKm(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lon - p1.lon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointSegmentDistanceKm(p, a, b) {
  const R = 6371;
  const toRad = (deg) => deg * Math.PI / 180;
  const toDeg = (rad) => rad * 180 / Math.PI;
  
  const lat1 = toRad(a.lat), lon1 = toRad(a.lon);
  const lat2 = toRad(b.lat), lon2 = toRad(b.lon);
  const latP = toRad(p.lat), lonP = toRad(p.lon);
  
  const d13 = Math.acos(Math.sin(lat1) * Math.sin(latP) + Math.cos(lat1) * Math.cos(latP) * Math.cos(lonP - lon1));
  const brng13 = Math.atan2(
    Math.sin(lonP - lon1) * Math.cos(latP),
    Math.cos(lat1) * Math.sin(latP) - Math.sin(lat1) * Math.cos(latP) * Math.cos(lonP - lon1)
  );
  const brng12 = Math.atan2(
    Math.sin(lon2 - lon1) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  );
  
  const dXt = Math.asin(Math.sin(d13) * Math.sin(brng13 - brng12));
  return Math.abs(R * dXt);
}

function minDistanceToLine(point, coords) {
  if (coords.length === 0) return Infinity;
  if (coords.length === 1) return haversineKm(point, coords[0]);
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointSegmentDistanceKm(point, coords[i], coords[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

const results = [];
let maxD1 = 0, maxD2 = 0;

acg.crossings.slice(0, 15).forEach((c, i) => {
  const [l1, l2] = c.lines;
  const d1 = minDistanceToLine(c.at, l1.coordinates);
  const d2 = minDistanceToLine(c.at, l2.coordinates);
  if (d1 > maxD1) maxD1 = d1;
  if (d2 > maxD2) maxD2 = d2;
  results.push({ i, cls: c.classification, d1: d1.toFixed(1), d2: d2.toFixed(1) });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outPath = path.join(__dirname, 'output', 'repro-crossing.txt');

const output = `Crossing validation for first 15 crossings:
${results.map(r => `[${r.i}] ${r.cls}: d1=${r.d1} km, d2=${r.d2} km`).join('\n')}

max d1 ${maxD1.toFixed(1)} max d2 ${maxD2.toFixed(1)}
`;

await writeFile(outPath, output);
console.log(`Output written to ${outPath}`);
