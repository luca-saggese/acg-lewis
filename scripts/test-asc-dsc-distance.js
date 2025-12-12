#!/usr/bin/env node
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
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
const bodies = ['sun'];

const options = {
  system: 'tropical',
  angularOrbDeg: 1,
  samplingStepDeg: 2,
  geoOrbKm: 300,
  cache: true,
};

const acg = computeACG(datetime, options, bodies, location);

function haversineKm(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lon - p1.lon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const sunLines = acg.lines.filter(l => l.body === 'sun');
const ascLine = sunLines.find(l => l.kind === 'ASC');
const dscLine = sunLines.find(l => l.kind === 'DSC');

let minDist = Infinity;
let closestPair = null;

if (ascLine && dscLine) {
  for (const asc of ascLine.coordinates) {
    for (const dsc of dscLine.coordinates) {
      const d = haversineKm(asc, dsc);
      if (d < minDist) {
        minDist = d;
        closestPair = { asc, dsc };
      }
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, 'output');
const outPath = path.join(outDir, 'asc-dsc-distance.txt');

const output = `ASC/DSC Closest Approach Test

Minimum distance between ASC and DSC: ${minDist.toFixed(1)} km

ASC point: lat=${closestPair.asc.lat.toFixed(2)}, lon=${closestPair.asc.lon.toFixed(2)}
DSC point: lat=${closestPair.dsc.lat.toFixed(2)}, lon=${closestPair.dsc.lon.toFixed(2)}

Note: If distance > ~50 km, they don't actually cross.
`;

await mkdir(outDir, { recursive: true });
await writeFile(outPath, output);
console.log(output);
