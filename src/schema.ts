import { z } from 'zod';

export const CoordinateSchema = z.object({ lat: z.number(), lon: z.number() });

export const BodySchema = z.union([
  z.literal('sun'),
  z.literal('moon'),
  z.literal('mercury'),
  z.literal('venus'),
  z.literal('mars'),
  z.literal('jupiter'),
  z.literal('saturn'),
  z.literal('uranus'),
  z.literal('neptune'),
  z.literal('pluto'),
  z.literal('true_node'),
  z.literal('mean_node'),
  z.literal('chiron'),
  z.literal('fortune'),
  z.object({ asteroid: z.number(), name: z.string().optional() }),
]);

export const BodyPositionSchema = z.object({
  body: BodySchema,
  jd: z.number(),
  ra: z.number(),
  dec: z.number(),
  eclipticLon: z.number(),
  eclipticLat: z.number(),
  distanceAU: z.number(),
  lst: z.number(),
});

export const CoordinateLineSchema = z.object({
  kind: z.enum(['MC', 'IC', 'ASC', 'DSC', 'LOCAL_SPACE', 'CROSSING']),
  body: BodySchema,
  coordinates: z.array(CoordinateSchema),
  geojson: z
    .object({
      type: z.literal('Feature'),
      geometry: z.object({ type: z.literal('LineString'), coordinates: z.array(z.tuple([z.number(), z.number()])) }),
      properties: z.record(z.unknown()).optional(),
    })
    .optional(),
  strength: z.enum(['strong', 'medium', 'weak']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CrossingSchema = z.object({
  at: CoordinateSchema,
  lines: z.tuple([CoordinateLineSchema, CoordinateLineSchema]),
  classification: z.enum(['real', 'pseudo']),
});

export const ACGLinesResultSchema = z.object({
  timestamp: z.string(),
  gst: z.number(),
  bodies: z.array(BodyPositionSchema),
  lines: z.array(CoordinateLineSchema),
  crossings: z.array(CrossingSchema),
  version: z.string(),
  options: z.record(z.unknown()),
});

export const ParanSchema = z.object({
  latitude: z.number(),
  bodies: z.tuple([BodySchema, BodySchema]),
  angles: z.tuple([z.enum(['MC', 'IC', 'ASC', 'DSC']), z.enum(['MC', 'IC', 'ASC', 'DSC'])]),
  orbDeg: z.number(),
});

export const ParansResultSchema = z.object({ parans: z.array(ParanSchema), version: z.string() });

export const LocalSpaceLineSchema = z.object({
  body: BodySchema,
  bearing: z.number(),
  coordinates: z.array(CoordinateSchema),
});

export const LocalSpaceResultSchema = z.object({
  origin: CoordinateSchema.extend({ alt: z.number().optional() }),
  lines: z.array(LocalSpaceLineSchema),
  version: z.string(),
});

export const LocationAnalysisItemSchema = z.object({
  body: BodySchema,
  angle: z.enum(['MC', 'IC', 'ASC', 'DSC']),
  distanceKm: z.number(),
  strength: z.enum(['strong', 'medium', 'weak']),
  force: z.number(),
});

export const LocationAnalysisResultSchema = z.object({
  city: CoordinateSchema.extend({ alt: z.number().optional() }),
  radiusKm: z.number(),
  active: z.array(LocationAnalysisItemSchema),
  parans: z.array(ParanSchema),
  ranking: z.array(LocationAnalysisItemSchema),
  version: z.string(),
});

export const RelocationChartResultSchema = z.object({
  location: CoordinateSchema.extend({ alt: z.number().optional() }),
  houses: z.record(z.array(z.number())),
  angles: z.record(z.number()),
  version: z.string(),
});

export const Schemas = {
  ACGLinesResultSchema,
  ParansResultSchema,
  LocalSpaceResultSchema,
  LocationAnalysisResultSchema,
  RelocationChartResultSchema,
};

export type Schemas = typeof Schemas;
