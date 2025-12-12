#!/usr/bin/env node
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { computeACG } from '../dist/index.js';

const datetime = { year: 1974, month: 8, day: 12, hour: 9, minute: 0, timezone: 'Europe/Rome' };
const location = { lat: 42, lon: 12, alt: 0 };
const bodies = ['sun'];
const options = { system: 'tropical', angularOrbDeg: 1, samplingStepDeg: 2, geoOrbKm: 300, cache: true };

const acg = computeACG(datetime, options, bodies, location);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, 'output');
const outPath = path.join(outDir, 'sun-crossings.txt');

let output = `Sun Crossings Test\n\n`;
output += `Total crossings: ${acg.crossings.length}\n\n`;

acg.crossings.slice(0, 20).forEach((c, i) => {
  const [l1, l2] = c.lines;
  output += `[${i}] ${l1.kind} × ${l2.kind} at (${c.at.lat.toFixed(2)}, ${c.at.lon.toFixed(2)}) - ${c.classification}\n`;
});

await mkdir(outDir, { recursive: true });
await writeFile(outPath, output);
console.log(output);
console.log(`Saved to ${outPath}`);
