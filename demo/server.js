#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import {
  computeACG,
  computeParans,
  computeLocalSpace,
  computeRelocationChart,
  analyzeLocation,
} from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

app.post('/api/compute', (req, res) => {
  try {
    const { datetime, location, bodies, options, radiusKm } = req.body || {};
    const opts = {
      system: 'tropical',
      angularOrbDeg: 1,
      samplingStepDeg: 2,
      geoOrbKm: 300,
      cache: true,
      ...options,
    };
    let start = Date.now();
    const acg = computeACG(datetime, opts, bodies, location);
    console.log(`Computed ACG in ${Date.now() - start} ms`);
    console.log({datetime, opts, bodies, location})
    console.log(JSON.stringify(acg.lines[0],null,4))
    start = Date.now();
    const parans = computeParans(datetime, opts, bodies, 2);
    console.log(`Computed Parans in ${Date.now() - start} ms`);
    start = Date.now();
    const ls = computeLocalSpace(datetime, location, opts, bodies);
    console.log(`Computed Local Space in ${Date.now() - start} ms`);
    start = Date.now();
    const relocation = computeRelocationChart(datetime, location, opts);
    console.log(`Computed Relocation Chart in ${Date.now() - start} ms`);
    start = Date.now();
    const analysis = analyzeLocation(location, radiusKm ?? 500, acg, parans.parans, opts);
    console.log(`Computed Location Analysis in ${Date.now() - start} ms`);
    res.json({ acg, parans, localSpace: ls, relocation, analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

const port = process.env.PORT || 4173;
app.listen(port, () => {
  console.log(`Demo server running at http://localhost:${port}`);
});
