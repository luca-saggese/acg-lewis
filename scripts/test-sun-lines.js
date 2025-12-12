#!/usr/bin/env node
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
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
const bodies = ['sun']; // Only sun

const options = {
  system: 'tropical',
  angularOrbDeg: 1,
  samplingStepDeg: 1,
  geoOrbKm: 300,
  cache: true,
};

const acg = computeACG(datetime, options, bodies, location);

// Check ASC/DSC lines for sun
const sunLines = acg.lines.filter(l => l.body === 'sun');
const ascLine = sunLines.find(l => l.kind === 'ASC');
const dscLine = sunLines.find(l => l.kind === 'DSC');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, 'output');
const outPath = path.join(outDir, 'test-sun-lines.txt');

let output = `Sun ACG Lines Test (${datetime.year}-${datetime.month}-${datetime.day} ${datetime.hour}:${datetime.minute})\n\n`;

output += `Total lines: ${acg.lines.length}\n`;
output += `Sun lines: ${sunLines.length}\n\n`;

if (ascLine) {
  output += `ASC Line:\n`;
  output += `  Points: ${ascLine.coordinates.length}\n`;
  output += `  First 10 points:\n`;
  ascLine.coordinates.slice(0, 10).forEach((c, i) => {
    output += `    [${i}] lat=${c.lat.toFixed(2)} lon=${c.lon.toFixed(2)}\n`;
  });
  output += `  Last 10 points:\n`;
  ascLine.coordinates.slice(-10).forEach((c, i) => {
    output += `    [${ascLine.coordinates.length - 10 + i}] lat=${c.lat.toFixed(2)} lon=${c.lon.toFixed(2)}\n`;
  });
  
  // Check for discontinuities
  let maxJump = 0;
  for (let i = 0; i < ascLine.coordinates.length - 1; i++) {
    const d1 = ascLine.coordinates[i];
    const d2 = ascLine.coordinates[i + 1];
    const latJump = Math.abs(d2.lat - d1.lat);
    const lonJump = Math.abs(d2.lon - d1.lon);
    if (latJump > maxJump) maxJump = latJump;
    if (lonJump > maxJump) maxJump = lonJump;
  }
  output += `  Max coordinate jump: ${maxJump.toFixed(2)} degrees\n\n`;
}

if (dscLine) {
  output += `DSC Line:\n`;
  output += `  Points: ${dscLine.coordinates.length}\n`;
  output += `  First 10 points:\n`;
  dscLine.coordinates.slice(0, 10).forEach((c, i) => {
    output += `    [${i}] lat=${c.lat.toFixed(2)} lon=${c.lon.toFixed(2)}\n`;
  });
  
  // Check for discontinuities
  let maxJump = 0;
  for (let i = 0; i < dscLine.coordinates.length - 1; i++) {
    const d1 = dscLine.coordinates[i];
    const d2 = dscLine.coordinates[i + 1];
    const latJump = Math.abs(d2.lat - d1.lat);
    const lonJump = Math.abs(d2.lon - d1.lon);
    if (latJump > maxJump) maxJump = latJump;
    if (lonJump > maxJump) maxJump = lonJump;
  }
  output += `  Max coordinate jump: ${maxJump.toFixed(2)} degrees\n\n`;
}

// Save full JSON for inspection
const jsonPath = path.join(outDir, 'test-sun-lines.json');
await mkdir(outDir, { recursive: true });
await writeFile(jsonPath, JSON.stringify({ acg, ascLine, dscLine }, null, 2));
await writeFile(outPath, output);

console.log(output);
console.log(`Full output saved to ${outPath}`);
console.log(`JSON saved to ${jsonPath}`);
