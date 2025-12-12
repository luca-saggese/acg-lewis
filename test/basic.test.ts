import { describe, it, expect } from 'vitest';
import {
  computeACG,
  computeParans,
  computeLocalSpace,
  computeRelocationChart,
  analyzeLocation,
} from '../src/index';
import type { CalculationOptions } from '../src/types';

const datetime = {
  year: 1990,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
  timezone: 'UTC',
};

const julianDatetime = {
  year: 1500,
  month: 3,
  day: 10,
  hour: 12,
  minute: 0,
  timezone: 'UTC',
  calendar: 'julian' as const,
};

const bodies = ['sun', 'moon', 'mercury', 'venus', 'mars'] as const;

const opts: CalculationOptions = {
  system: 'tropical',
  angularOrbDeg: 1,
  samplingStepDeg: 2,
  geoOrbKm: 300,
  cache: true,
};

describe('public API presence', () => {
  it('computes acg', () => {
    const acg = computeACG(datetime, opts, bodies as any);
    expect(acg.lines.length).toBeGreaterThan(0);
    expect(Array.isArray(acg.crossings)).toBe(true);
  });

  it('supports julian calendar input', () => {
    const acg = computeACG(julianDatetime, opts, bodies as any);
    expect(acg.lines.length).toBeGreaterThan(0);
  });

  it('handles timezone and DST correctly', () => {
    const romeTime = { year: 2020, month: 6, day: 21, hour: 12, minute: 0, timezone: 'Europe/Rome' } as const;
    const utcTime = { year: 2020, month: 6, day: 21, hour: 10, minute: 0, timezone: 'UTC' } as const;
    const acgRome = computeACG(romeTime, opts, bodies as any);
    const acgUtc = computeACG(utcTime, opts, bodies as any);
    expect(Math.abs(acgRome.gst - acgUtc.gst)).toBeLessThan(0.01);
  });

  it('computes parans', () => {
    const res = computeParans(datetime, opts, bodies as any, 5);
    expect(res.parans).toBeTypeOf('object');
  });

  it('computes local space', () => {
    const res = computeLocalSpace(datetime, { lat: 40, lon: -3, alt: 0 }, opts, bodies as any);
    expect(res.lines.length).toBeGreaterThan(0);
  });

  it('computes relocation chart', () => {
    const res = computeRelocationChart(datetime, { lat: 40, lon: -3, alt: 0 }, opts);
    expect(res.angles.ASC).toBeDefined();
    expect(res.houses.koch).toBeDefined();
    expect(res.houses.equal).toBeDefined();
    expect(res.houses.wholesign).toBeDefined();
  });

  it('analyzes location', () => {
    const acg = computeACG(datetime, opts, bodies as any);
    const parans = computeParans(datetime, opts, bodies as any, 10);
    const res = analyzeLocation({ lat: 40, lon: -3, alt: 0 }, 500, acg, parans.parans, opts);
    expect(res.active.length).toBeGreaterThanOrEqual(0);
    if (res.active[0]) expect(res.active[0].force).toBeGreaterThan(0);
  });
});
