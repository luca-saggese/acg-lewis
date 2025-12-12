#!/usr/bin/env node
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  computeACG,
  computeParans,
  computeLocalSpace,
  computeRelocationChart,
  analyzeLocation,
} from '../dist/index.js';

// Snapshot the same payload produced by the demo API for a fixed natal chart.
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
const radiusKm = 500;

const options = {
  system: 'tropical',
  angularOrbDeg: 1,
  samplingStepDeg: 1,
  geoOrbKm: 300,
  cache: true,
};

const acg = computeACG(datetime, options, bodies, location);
const parans = computeParans(datetime, options, bodies, 2);
const localSpace = computeLocalSpace(datetime, location, options, bodies);
const relocation = computeRelocationChart(datetime, location, options);
const analysis = analyzeLocation(location, radiusKm, acg, parans.parans, options);

const payload = { acg, parans, localSpace, relocation, analysis };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, 'output');
const outPath = path.join(outDir, 'demo-1974-08-12T09-00.json');

await mkdir(outDir, { recursive: true });
await writeFile(outPath, JSON.stringify(payload, null, 2), { flag: 'w' });
console.log(`Saved demo snapshot to ${outPath}`);
