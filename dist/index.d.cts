import { z } from 'zod';

type Coordinate = {
    lat: number;
    lon: number;
};
type CoordinateLine = {
    kind: 'MC' | 'IC' | 'ASC' | 'DSC' | 'LOCAL_SPACE' | 'CROSSING';
    body: Body;
    coordinates: Coordinate[];
    geojson?: GeoJSONLineString;
    strength?: LineStrength;
    metadata?: Record<string, unknown>;
};
type CrossingClassification = 'real' | 'pseudo';
type Crossing = {
    at: Coordinate;
    lines: [CoordinateLine, CoordinateLine];
    classification: CrossingClassification;
};
type LineStrength = 'strong' | 'medium' | 'weak';
type Body = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto' | 'true_node' | 'mean_node' | 'chiron' | 'fortune' | {
    asteroid: number;
    name?: string;
};
type Angle = 'MC' | 'IC' | 'ASC' | 'DSC';
type Ayanamsa = 'lahiri' | 'krishnamurti' | 'raman' | 'fagan_bradley' | 'yukteshwar' | 'true_citra' | 'user';
interface DateTimeInput {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second?: number;
    timezone?: string;
    dstMinutes?: number;
    calendar?: 'gregorian' | 'julian';
}
interface Location {
    lat: number;
    lon: number;
    alt?: number;
}
interface CalculationOptions {
    system?: 'tropical' | 'sidereal';
    ayanamsa?: Ayanamsa;
    angularOrbDeg?: number;
    geoOrbKm?: number;
    samplingStepDeg?: number;
    refractAscDsc?: boolean;
    moonParallax?: boolean;
    ephemerisPath?: string;
    cache?: boolean;
    parallel?: boolean;
}
interface BodyPosition {
    body: Body;
    jd: number;
    ra: number;
    dec: number;
    eclipticLon: number;
    eclipticLat: number;
    distanceAU: number;
    lst: number;
}
interface ACGLinesResult {
    timestamp: string;
    gst: number;
    bodies: BodyPosition[];
    lines: CoordinateLine[];
    crossings: Crossing[];
    version: string;
    options: CalculationOptions;
}
interface Paran {
    latitude: number;
    bodies: [Body, Body];
    angles: [Angle, Angle];
    orbDeg: number;
}
interface ParansResult {
    parans: Paran[];
    version: string;
}
interface LocalSpaceLine {
    body: Body;
    bearing: number;
    coordinates: Coordinate[];
}
interface LocalSpaceResult {
    origin: Location;
    lines: LocalSpaceLine[];
    version: string;
}
interface RelocationChartResult {
    location: Location;
    houses: Record<string, number[]>;
    angles: Record<'ASC' | 'MC' | 'IC' | 'DSC', number>;
    version: string;
}
interface LocationAnalysisItem {
    body: Body;
    angle: Angle;
    distanceKm: number;
    strength: LineStrength;
    force: number;
}
interface LocationAnalysisResult {
    city: Location;
    radiusKm: number;
    active: LocationAnalysisItem[];
    parans: Paran[];
    ranking: LocationAnalysisItem[];
    version: string;
}
type GeoJSONLineString = {
    type: 'Feature';
    geometry: {
        type: 'LineString';
        coordinates: Array<[number, number]>;
    };
    properties?: Record<string, unknown>;
};

type EphemerisConfig = {
    ephemerisPath?: string;
    useTopocentric?: boolean;
};
declare function initEphemeris(config?: EphemerisConfig): void;
type DateTimeInputNormalized = {
    year: number;
    month: number;
    day: number;
    hourDecimal: number;
    calendar: 'gregorian' | 'julian';
};
declare function normalizeDateTime(input: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second?: number;
    timezone?: string;
    dstMinutes?: number;
    calendar?: 'gregorian' | 'julian';
}): DateTimeInputNormalized;

declare function computeACG(datetime: Parameters<typeof normalizeDateTime>[0], opts: CalculationOptions, bodies: Body[], baseLocation?: Location): ACGLinesResult;

declare function computeParans(datetime: Parameters<typeof normalizeDateTime>[0], opts: CalculationOptions, bodies: Body[], latStep?: number): ParansResult;

declare function computeLocalSpace(datetime: Parameters<typeof normalizeDateTime>[0], origin: Location, opts: CalculationOptions, bodies: Body[]): LocalSpaceResult;

declare function computeRelocationChart(datetime: Parameters<typeof normalizeDateTime>[0], location: Location, opts: CalculationOptions): RelocationChartResult;

declare function analyzeLocation(city: Location, radiusKm: number, acg: ACGLinesResult, parans: Paran[], opts: CalculationOptions): LocationAnalysisResult;

declare const CoordinateSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lon: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lon: number;
}, {
    lat: number;
    lon: number;
}>;
declare const BodySchema: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
    asteroid: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    asteroid: number;
    name?: string | undefined;
}, {
    asteroid: number;
    name?: string | undefined;
}>]>;
declare const BodyPositionSchema: z.ZodObject<{
    body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
        asteroid: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        asteroid: number;
        name?: string | undefined;
    }, {
        asteroid: number;
        name?: string | undefined;
    }>]>;
    jd: z.ZodNumber;
    ra: z.ZodNumber;
    dec: z.ZodNumber;
    eclipticLon: z.ZodNumber;
    eclipticLat: z.ZodNumber;
    distanceAU: z.ZodNumber;
    lst: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lst: number;
    body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    };
    jd: number;
    ra: number;
    dec: number;
    eclipticLon: number;
    eclipticLat: number;
    distanceAU: number;
}, {
    lst: number;
    body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    };
    jd: number;
    ra: number;
    dec: number;
    eclipticLon: number;
    eclipticLat: number;
    distanceAU: number;
}>;
declare const CoordinateLineSchema: z.ZodObject<{
    kind: z.ZodEnum<["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]>;
    body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
        asteroid: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        asteroid: number;
        name?: string | undefined;
    }, {
        asteroid: number;
        name?: string | undefined;
    }>]>;
    coordinates: z.ZodArray<z.ZodObject<{
        lat: z.ZodNumber;
        lon: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lon: number;
    }, {
        lat: number;
        lon: number;
    }>, "many">;
    geojson: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Feature">;
        geometry: z.ZodObject<{
            type: z.ZodLiteral<"LineString">;
            coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
        }, "strip", z.ZodTypeAny, {
            type: "LineString";
            coordinates: [number, number][];
        }, {
            type: "LineString";
            coordinates: [number, number][];
        }>;
        properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        type: "Feature";
        geometry: {
            type: "LineString";
            coordinates: [number, number][];
        };
        properties?: Record<string, unknown> | undefined;
    }, {
        type: "Feature";
        geometry: {
            type: "LineString";
            coordinates: [number, number][];
        };
        properties?: Record<string, unknown> | undefined;
    }>>;
    strength: z.ZodOptional<z.ZodEnum<["strong", "medium", "weak"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    };
    kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
    coordinates: {
        lat: number;
        lon: number;
    }[];
    geojson?: {
        type: "Feature";
        geometry: {
            type: "LineString";
            coordinates: [number, number][];
        };
        properties?: Record<string, unknown> | undefined;
    } | undefined;
    strength?: "strong" | "medium" | "weak" | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    };
    kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
    coordinates: {
        lat: number;
        lon: number;
    }[];
    geojson?: {
        type: "Feature";
        geometry: {
            type: "LineString";
            coordinates: [number, number][];
        };
        properties?: Record<string, unknown> | undefined;
    } | undefined;
    strength?: "strong" | "medium" | "weak" | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
declare const CrossingSchema: z.ZodObject<{
    at: z.ZodObject<{
        lat: z.ZodNumber;
        lon: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lon: number;
    }, {
        lat: number;
        lon: number;
    }>;
    lines: z.ZodTuple<[z.ZodObject<{
        kind: z.ZodEnum<["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]>;
        body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>;
        coordinates: z.ZodArray<z.ZodObject<{
            lat: z.ZodNumber;
            lon: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lon: number;
        }, {
            lat: number;
            lon: number;
        }>, "many">;
        geojson: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"Feature">;
            geometry: z.ZodObject<{
                type: z.ZodLiteral<"LineString">;
                coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
            }, "strip", z.ZodTypeAny, {
                type: "LineString";
                coordinates: [number, number][];
            }, {
                type: "LineString";
                coordinates: [number, number][];
            }>;
            properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        }, {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        }>>;
        strength: z.ZodOptional<z.ZodEnum<["strong", "medium", "weak"]>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>, z.ZodObject<{
        kind: z.ZodEnum<["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]>;
        body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>;
        coordinates: z.ZodArray<z.ZodObject<{
            lat: z.ZodNumber;
            lon: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lon: number;
        }, {
            lat: number;
            lon: number;
        }>, "many">;
        geojson: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"Feature">;
            geometry: z.ZodObject<{
                type: z.ZodLiteral<"LineString">;
                coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
            }, "strip", z.ZodTypeAny, {
                type: "LineString";
                coordinates: [number, number][];
            }, {
                type: "LineString";
                coordinates: [number, number][];
            }>;
            properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        }, {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        }>>;
        strength: z.ZodOptional<z.ZodEnum<["strong", "medium", "weak"]>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>], null>;
    classification: z.ZodEnum<["real", "pseudo"]>;
}, "strip", z.ZodTypeAny, {
    at: {
        lat: number;
        lon: number;
    };
    lines: [{
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }];
    classification: "real" | "pseudo";
}, {
    at: {
        lat: number;
        lon: number;
    };
    lines: [{
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }];
    classification: "real" | "pseudo";
}>;
declare const ACGLinesResultSchema: z.ZodObject<{
    timestamp: z.ZodString;
    gst: z.ZodNumber;
    bodies: z.ZodArray<z.ZodObject<{
        body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>;
        jd: z.ZodNumber;
        ra: z.ZodNumber;
        dec: z.ZodNumber;
        eclipticLon: z.ZodNumber;
        eclipticLat: z.ZodNumber;
        distanceAU: z.ZodNumber;
        lst: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lst: number;
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        jd: number;
        ra: number;
        dec: number;
        eclipticLon: number;
        eclipticLat: number;
        distanceAU: number;
    }, {
        lst: number;
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        jd: number;
        ra: number;
        dec: number;
        eclipticLon: number;
        eclipticLat: number;
        distanceAU: number;
    }>, "many">;
    lines: z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]>;
        body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>;
        coordinates: z.ZodArray<z.ZodObject<{
            lat: z.ZodNumber;
            lon: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lon: number;
        }, {
            lat: number;
            lon: number;
        }>, "many">;
        geojson: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"Feature">;
            geometry: z.ZodObject<{
                type: z.ZodLiteral<"LineString">;
                coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
            }, "strip", z.ZodTypeAny, {
                type: "LineString";
                coordinates: [number, number][];
            }, {
                type: "LineString";
                coordinates: [number, number][];
            }>;
            properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        }, {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        }>>;
        strength: z.ZodOptional<z.ZodEnum<["strong", "medium", "weak"]>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
    crossings: z.ZodArray<z.ZodObject<{
        at: z.ZodObject<{
            lat: z.ZodNumber;
            lon: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lon: number;
        }, {
            lat: number;
            lon: number;
        }>;
        lines: z.ZodTuple<[z.ZodObject<{
            kind: z.ZodEnum<["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]>;
            body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>;
            coordinates: z.ZodArray<z.ZodObject<{
                lat: z.ZodNumber;
                lon: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lon: number;
            }, {
                lat: number;
                lon: number;
            }>, "many">;
            geojson: z.ZodOptional<z.ZodObject<{
                type: z.ZodLiteral<"Feature">;
                geometry: z.ZodObject<{
                    type: z.ZodLiteral<"LineString">;
                    coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
                }, "strip", z.ZodTypeAny, {
                    type: "LineString";
                    coordinates: [number, number][];
                }, {
                    type: "LineString";
                    coordinates: [number, number][];
                }>;
                properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, "strip", z.ZodTypeAny, {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            }, {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            }>>;
            strength: z.ZodOptional<z.ZodEnum<["strong", "medium", "weak"]>>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }>, z.ZodObject<{
            kind: z.ZodEnum<["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]>;
            body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>;
            coordinates: z.ZodArray<z.ZodObject<{
                lat: z.ZodNumber;
                lon: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lon: number;
            }, {
                lat: number;
                lon: number;
            }>, "many">;
            geojson: z.ZodOptional<z.ZodObject<{
                type: z.ZodLiteral<"Feature">;
                geometry: z.ZodObject<{
                    type: z.ZodLiteral<"LineString">;
                    coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
                }, "strip", z.ZodTypeAny, {
                    type: "LineString";
                    coordinates: [number, number][];
                }, {
                    type: "LineString";
                    coordinates: [number, number][];
                }>;
                properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, "strip", z.ZodTypeAny, {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            }, {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            }>>;
            strength: z.ZodOptional<z.ZodEnum<["strong", "medium", "weak"]>>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }>], null>;
        classification: z.ZodEnum<["real", "pseudo"]>;
    }, "strip", z.ZodTypeAny, {
        at: {
            lat: number;
            lon: number;
        };
        lines: [{
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }];
        classification: "real" | "pseudo";
    }, {
        at: {
            lat: number;
            lon: number;
        };
        lines: [{
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }];
        classification: "real" | "pseudo";
    }>, "many">;
    version: z.ZodString;
    options: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    options: Record<string, unknown>;
    lines: {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[];
    timestamp: string;
    gst: number;
    bodies: {
        lst: number;
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        jd: number;
        ra: number;
        dec: number;
        eclipticLon: number;
        eclipticLat: number;
        distanceAU: number;
    }[];
    crossings: {
        at: {
            lat: number;
            lon: number;
        };
        lines: [{
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }];
        classification: "real" | "pseudo";
    }[];
    version: string;
}, {
    options: Record<string, unknown>;
    lines: {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
        coordinates: {
            lat: number;
            lon: number;
        }[];
        geojson?: {
            type: "Feature";
            geometry: {
                type: "LineString";
                coordinates: [number, number][];
            };
            properties?: Record<string, unknown> | undefined;
        } | undefined;
        strength?: "strong" | "medium" | "weak" | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[];
    timestamp: string;
    gst: number;
    bodies: {
        lst: number;
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        jd: number;
        ra: number;
        dec: number;
        eclipticLon: number;
        eclipticLat: number;
        distanceAU: number;
    }[];
    crossings: {
        at: {
            lat: number;
            lon: number;
        };
        lines: [{
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }];
        classification: "real" | "pseudo";
    }[];
    version: string;
}>;
declare const ParanSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    bodies: z.ZodTuple<[z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
        asteroid: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        asteroid: number;
        name?: string | undefined;
    }, {
        asteroid: number;
        name?: string | undefined;
    }>]>, z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
        asteroid: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        asteroid: number;
        name?: string | undefined;
    }, {
        asteroid: number;
        name?: string | undefined;
    }>]>], null>;
    angles: z.ZodTuple<[z.ZodEnum<["MC", "IC", "ASC", "DSC"]>, z.ZodEnum<["MC", "IC", "ASC", "DSC"]>], null>;
    orbDeg: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    }];
    angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
    orbDeg: number;
}, {
    latitude: number;
    bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    }];
    angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
    orbDeg: number;
}>;
declare const ParansResultSchema: z.ZodObject<{
    parans: z.ZodArray<z.ZodObject<{
        latitude: z.ZodNumber;
        bodies: z.ZodTuple<[z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>, z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>], null>;
        angles: z.ZodTuple<[z.ZodEnum<["MC", "IC", "ASC", "DSC"]>, z.ZodEnum<["MC", "IC", "ASC", "DSC"]>], null>;
        orbDeg: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }];
        angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
        orbDeg: number;
    }, {
        latitude: number;
        bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }];
        angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
        orbDeg: number;
    }>, "many">;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    version: string;
    parans: {
        latitude: number;
        bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }];
        angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
        orbDeg: number;
    }[];
}, {
    version: string;
    parans: {
        latitude: number;
        bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }];
        angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
        orbDeg: number;
    }[];
}>;
declare const LocalSpaceLineSchema: z.ZodObject<{
    body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
        asteroid: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        asteroid: number;
        name?: string | undefined;
    }, {
        asteroid: number;
        name?: string | undefined;
    }>]>;
    bearing: z.ZodNumber;
    coordinates: z.ZodArray<z.ZodObject<{
        lat: z.ZodNumber;
        lon: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lon: number;
    }, {
        lat: number;
        lon: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    };
    coordinates: {
        lat: number;
        lon: number;
    }[];
    bearing: number;
}, {
    body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    };
    coordinates: {
        lat: number;
        lon: number;
    }[];
    bearing: number;
}>;
declare const LocalSpaceResultSchema: z.ZodObject<{
    origin: z.ZodObject<{
        lat: z.ZodNumber;
        lon: z.ZodNumber;
    } & {
        alt: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lon: number;
        alt?: number | undefined;
    }, {
        lat: number;
        lon: number;
        alt?: number | undefined;
    }>;
    lines: z.ZodArray<z.ZodObject<{
        body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>;
        bearing: z.ZodNumber;
        coordinates: z.ZodArray<z.ZodObject<{
            lat: z.ZodNumber;
            lon: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lon: number;
        }, {
            lat: number;
            lon: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        coordinates: {
            lat: number;
            lon: number;
        }[];
        bearing: number;
    }, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        coordinates: {
            lat: number;
            lon: number;
        }[];
        bearing: number;
    }>, "many">;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    lines: {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        coordinates: {
            lat: number;
            lon: number;
        }[];
        bearing: number;
    }[];
    version: string;
    origin: {
        lat: number;
        lon: number;
        alt?: number | undefined;
    };
}, {
    lines: {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        coordinates: {
            lat: number;
            lon: number;
        }[];
        bearing: number;
    }[];
    version: string;
    origin: {
        lat: number;
        lon: number;
        alt?: number | undefined;
    };
}>;
declare const LocationAnalysisItemSchema: z.ZodObject<{
    body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
        asteroid: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        asteroid: number;
        name?: string | undefined;
    }, {
        asteroid: number;
        name?: string | undefined;
    }>]>;
    angle: z.ZodEnum<["MC", "IC", "ASC", "DSC"]>;
    distanceKm: z.ZodNumber;
    strength: z.ZodEnum<["strong", "medium", "weak"]>;
    force: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    };
    strength: "strong" | "medium" | "weak";
    angle: "MC" | "IC" | "ASC" | "DSC";
    distanceKm: number;
    force: number;
}, {
    body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
        asteroid: number;
        name?: string | undefined;
    };
    strength: "strong" | "medium" | "weak";
    angle: "MC" | "IC" | "ASC" | "DSC";
    distanceKm: number;
    force: number;
}>;
declare const LocationAnalysisResultSchema: z.ZodObject<{
    city: z.ZodObject<{
        lat: z.ZodNumber;
        lon: z.ZodNumber;
    } & {
        alt: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lon: number;
        alt?: number | undefined;
    }, {
        lat: number;
        lon: number;
        alt?: number | undefined;
    }>;
    radiusKm: z.ZodNumber;
    active: z.ZodArray<z.ZodObject<{
        body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>;
        angle: z.ZodEnum<["MC", "IC", "ASC", "DSC"]>;
        distanceKm: z.ZodNumber;
        strength: z.ZodEnum<["strong", "medium", "weak"]>;
        force: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        strength: "strong" | "medium" | "weak";
        angle: "MC" | "IC" | "ASC" | "DSC";
        distanceKm: number;
        force: number;
    }, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        strength: "strong" | "medium" | "weak";
        angle: "MC" | "IC" | "ASC" | "DSC";
        distanceKm: number;
        force: number;
    }>, "many">;
    parans: z.ZodArray<z.ZodObject<{
        latitude: z.ZodNumber;
        bodies: z.ZodTuple<[z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>, z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>], null>;
        angles: z.ZodTuple<[z.ZodEnum<["MC", "IC", "ASC", "DSC"]>, z.ZodEnum<["MC", "IC", "ASC", "DSC"]>], null>;
        orbDeg: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }];
        angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
        orbDeg: number;
    }, {
        latitude: number;
        bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }];
        angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
        orbDeg: number;
    }>, "many">;
    ranking: z.ZodArray<z.ZodObject<{
        body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
            asteroid: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            asteroid: number;
            name?: string | undefined;
        }, {
            asteroid: number;
            name?: string | undefined;
        }>]>;
        angle: z.ZodEnum<["MC", "IC", "ASC", "DSC"]>;
        distanceKm: z.ZodNumber;
        strength: z.ZodEnum<["strong", "medium", "weak"]>;
        force: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        strength: "strong" | "medium" | "weak";
        angle: "MC" | "IC" | "ASC" | "DSC";
        distanceKm: number;
        force: number;
    }, {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        strength: "strong" | "medium" | "weak";
        angle: "MC" | "IC" | "ASC" | "DSC";
        distanceKm: number;
        force: number;
    }>, "many">;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    version: string;
    parans: {
        latitude: number;
        bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }];
        angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
        orbDeg: number;
    }[];
    city: {
        lat: number;
        lon: number;
        alt?: number | undefined;
    };
    radiusKm: number;
    active: {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        strength: "strong" | "medium" | "weak";
        angle: "MC" | "IC" | "ASC" | "DSC";
        distanceKm: number;
        force: number;
    }[];
    ranking: {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        strength: "strong" | "medium" | "weak";
        angle: "MC" | "IC" | "ASC" | "DSC";
        distanceKm: number;
        force: number;
    }[];
}, {
    version: string;
    parans: {
        latitude: number;
        bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        }];
        angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
        orbDeg: number;
    }[];
    city: {
        lat: number;
        lon: number;
        alt?: number | undefined;
    };
    radiusKm: number;
    active: {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        strength: "strong" | "medium" | "weak";
        angle: "MC" | "IC" | "ASC" | "DSC";
        distanceKm: number;
        force: number;
    }[];
    ranking: {
        body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
            asteroid: number;
            name?: string | undefined;
        };
        strength: "strong" | "medium" | "weak";
        angle: "MC" | "IC" | "ASC" | "DSC";
        distanceKm: number;
        force: number;
    }[];
}>;
declare const RelocationChartResultSchema: z.ZodObject<{
    location: z.ZodObject<{
        lat: z.ZodNumber;
        lon: z.ZodNumber;
    } & {
        alt: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lon: number;
        alt?: number | undefined;
    }, {
        lat: number;
        lon: number;
        alt?: number | undefined;
    }>;
    houses: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodNumber, "many">>;
    angles: z.ZodRecord<z.ZodString, z.ZodNumber>;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    version: string;
    angles: Record<string, number>;
    location: {
        lat: number;
        lon: number;
        alt?: number | undefined;
    };
    houses: Record<string, number[]>;
}, {
    version: string;
    angles: Record<string, number>;
    location: {
        lat: number;
        lon: number;
        alt?: number | undefined;
    };
    houses: Record<string, number[]>;
}>;
declare const Schemas: {
    ACGLinesResultSchema: z.ZodObject<{
        timestamp: z.ZodString;
        gst: z.ZodNumber;
        bodies: z.ZodArray<z.ZodObject<{
            body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>;
            jd: z.ZodNumber;
            ra: z.ZodNumber;
            dec: z.ZodNumber;
            eclipticLon: z.ZodNumber;
            eclipticLat: z.ZodNumber;
            distanceAU: z.ZodNumber;
            lst: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lst: number;
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            jd: number;
            ra: number;
            dec: number;
            eclipticLon: number;
            eclipticLat: number;
            distanceAU: number;
        }, {
            lst: number;
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            jd: number;
            ra: number;
            dec: number;
            eclipticLon: number;
            eclipticLat: number;
            distanceAU: number;
        }>, "many">;
        lines: z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]>;
            body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>;
            coordinates: z.ZodArray<z.ZodObject<{
                lat: z.ZodNumber;
                lon: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lon: number;
            }, {
                lat: number;
                lon: number;
            }>, "many">;
            geojson: z.ZodOptional<z.ZodObject<{
                type: z.ZodLiteral<"Feature">;
                geometry: z.ZodObject<{
                    type: z.ZodLiteral<"LineString">;
                    coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
                }, "strip", z.ZodTypeAny, {
                    type: "LineString";
                    coordinates: [number, number][];
                }, {
                    type: "LineString";
                    coordinates: [number, number][];
                }>;
                properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, "strip", z.ZodTypeAny, {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            }, {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            }>>;
            strength: z.ZodOptional<z.ZodEnum<["strong", "medium", "weak"]>>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }>, "many">;
        crossings: z.ZodArray<z.ZodObject<{
            at: z.ZodObject<{
                lat: z.ZodNumber;
                lon: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lon: number;
            }, {
                lat: number;
                lon: number;
            }>;
            lines: z.ZodTuple<[z.ZodObject<{
                kind: z.ZodEnum<["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]>;
                body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                    asteroid: z.ZodNumber;
                    name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    asteroid: number;
                    name?: string | undefined;
                }, {
                    asteroid: number;
                    name?: string | undefined;
                }>]>;
                coordinates: z.ZodArray<z.ZodObject<{
                    lat: z.ZodNumber;
                    lon: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    lat: number;
                    lon: number;
                }, {
                    lat: number;
                    lon: number;
                }>, "many">;
                geojson: z.ZodOptional<z.ZodObject<{
                    type: z.ZodLiteral<"Feature">;
                    geometry: z.ZodObject<{
                        type: z.ZodLiteral<"LineString">;
                        coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
                    }, "strip", z.ZodTypeAny, {
                        type: "LineString";
                        coordinates: [number, number][];
                    }, {
                        type: "LineString";
                        coordinates: [number, number][];
                    }>;
                    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
                }, "strip", z.ZodTypeAny, {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                }, {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                }>>;
                strength: z.ZodOptional<z.ZodEnum<["strong", "medium", "weak"]>>;
                metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, "strip", z.ZodTypeAny, {
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }, {
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }>, z.ZodObject<{
                kind: z.ZodEnum<["MC", "IC", "ASC", "DSC", "LOCAL_SPACE", "CROSSING"]>;
                body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                    asteroid: z.ZodNumber;
                    name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    asteroid: number;
                    name?: string | undefined;
                }, {
                    asteroid: number;
                    name?: string | undefined;
                }>]>;
                coordinates: z.ZodArray<z.ZodObject<{
                    lat: z.ZodNumber;
                    lon: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    lat: number;
                    lon: number;
                }, {
                    lat: number;
                    lon: number;
                }>, "many">;
                geojson: z.ZodOptional<z.ZodObject<{
                    type: z.ZodLiteral<"Feature">;
                    geometry: z.ZodObject<{
                        type: z.ZodLiteral<"LineString">;
                        coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
                    }, "strip", z.ZodTypeAny, {
                        type: "LineString";
                        coordinates: [number, number][];
                    }, {
                        type: "LineString";
                        coordinates: [number, number][];
                    }>;
                    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
                }, "strip", z.ZodTypeAny, {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                }, {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                }>>;
                strength: z.ZodOptional<z.ZodEnum<["strong", "medium", "weak"]>>;
                metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, "strip", z.ZodTypeAny, {
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }, {
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }>], null>;
            classification: z.ZodEnum<["real", "pseudo"]>;
        }, "strip", z.ZodTypeAny, {
            at: {
                lat: number;
                lon: number;
            };
            lines: [{
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }, {
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }];
            classification: "real" | "pseudo";
        }, {
            at: {
                lat: number;
                lon: number;
            };
            lines: [{
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }, {
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }];
            classification: "real" | "pseudo";
        }>, "many">;
        version: z.ZodString;
        options: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        options: Record<string, unknown>;
        lines: {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }[];
        timestamp: string;
        gst: number;
        bodies: {
            lst: number;
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            jd: number;
            ra: number;
            dec: number;
            eclipticLon: number;
            eclipticLat: number;
            distanceAU: number;
        }[];
        crossings: {
            at: {
                lat: number;
                lon: number;
            };
            lines: [{
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }, {
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }];
            classification: "real" | "pseudo";
        }[];
        version: string;
    }, {
        options: Record<string, unknown>;
        lines: {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
            coordinates: {
                lat: number;
                lon: number;
            }[];
            geojson?: {
                type: "Feature";
                geometry: {
                    type: "LineString";
                    coordinates: [number, number][];
                };
                properties?: Record<string, unknown> | undefined;
            } | undefined;
            strength?: "strong" | "medium" | "weak" | undefined;
            metadata?: Record<string, unknown> | undefined;
        }[];
        timestamp: string;
        gst: number;
        bodies: {
            lst: number;
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            jd: number;
            ra: number;
            dec: number;
            eclipticLon: number;
            eclipticLat: number;
            distanceAU: number;
        }[];
        crossings: {
            at: {
                lat: number;
                lon: number;
            };
            lines: [{
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }, {
                body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                    asteroid: number;
                    name?: string | undefined;
                };
                kind: "MC" | "IC" | "ASC" | "DSC" | "LOCAL_SPACE" | "CROSSING";
                coordinates: {
                    lat: number;
                    lon: number;
                }[];
                geojson?: {
                    type: "Feature";
                    geometry: {
                        type: "LineString";
                        coordinates: [number, number][];
                    };
                    properties?: Record<string, unknown> | undefined;
                } | undefined;
                strength?: "strong" | "medium" | "weak" | undefined;
                metadata?: Record<string, unknown> | undefined;
            }];
            classification: "real" | "pseudo";
        }[];
        version: string;
    }>;
    ParansResultSchema: z.ZodObject<{
        parans: z.ZodArray<z.ZodObject<{
            latitude: z.ZodNumber;
            bodies: z.ZodTuple<[z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>, z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>], null>;
            angles: z.ZodTuple<[z.ZodEnum<["MC", "IC", "ASC", "DSC"]>, z.ZodEnum<["MC", "IC", "ASC", "DSC"]>], null>;
            orbDeg: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }];
            angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
            orbDeg: number;
        }, {
            latitude: number;
            bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }];
            angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
            orbDeg: number;
        }>, "many">;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        version: string;
        parans: {
            latitude: number;
            bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }];
            angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
            orbDeg: number;
        }[];
    }, {
        version: string;
        parans: {
            latitude: number;
            bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }];
            angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
            orbDeg: number;
        }[];
    }>;
    LocalSpaceResultSchema: z.ZodObject<{
        origin: z.ZodObject<{
            lat: z.ZodNumber;
            lon: z.ZodNumber;
        } & {
            alt: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lon: number;
            alt?: number | undefined;
        }, {
            lat: number;
            lon: number;
            alt?: number | undefined;
        }>;
        lines: z.ZodArray<z.ZodObject<{
            body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>;
            bearing: z.ZodNumber;
            coordinates: z.ZodArray<z.ZodObject<{
                lat: z.ZodNumber;
                lon: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lon: number;
            }, {
                lat: number;
                lon: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            coordinates: {
                lat: number;
                lon: number;
            }[];
            bearing: number;
        }, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            coordinates: {
                lat: number;
                lon: number;
            }[];
            bearing: number;
        }>, "many">;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        lines: {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            coordinates: {
                lat: number;
                lon: number;
            }[];
            bearing: number;
        }[];
        version: string;
        origin: {
            lat: number;
            lon: number;
            alt?: number | undefined;
        };
    }, {
        lines: {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            coordinates: {
                lat: number;
                lon: number;
            }[];
            bearing: number;
        }[];
        version: string;
        origin: {
            lat: number;
            lon: number;
            alt?: number | undefined;
        };
    }>;
    LocationAnalysisResultSchema: z.ZodObject<{
        city: z.ZodObject<{
            lat: z.ZodNumber;
            lon: z.ZodNumber;
        } & {
            alt: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lon: number;
            alt?: number | undefined;
        }, {
            lat: number;
            lon: number;
            alt?: number | undefined;
        }>;
        radiusKm: z.ZodNumber;
        active: z.ZodArray<z.ZodObject<{
            body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>;
            angle: z.ZodEnum<["MC", "IC", "ASC", "DSC"]>;
            distanceKm: z.ZodNumber;
            strength: z.ZodEnum<["strong", "medium", "weak"]>;
            force: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            strength: "strong" | "medium" | "weak";
            angle: "MC" | "IC" | "ASC" | "DSC";
            distanceKm: number;
            force: number;
        }, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            strength: "strong" | "medium" | "weak";
            angle: "MC" | "IC" | "ASC" | "DSC";
            distanceKm: number;
            force: number;
        }>, "many">;
        parans: z.ZodArray<z.ZodObject<{
            latitude: z.ZodNumber;
            bodies: z.ZodTuple<[z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>, z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>], null>;
            angles: z.ZodTuple<[z.ZodEnum<["MC", "IC", "ASC", "DSC"]>, z.ZodEnum<["MC", "IC", "ASC", "DSC"]>], null>;
            orbDeg: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }];
            angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
            orbDeg: number;
        }, {
            latitude: number;
            bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }];
            angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
            orbDeg: number;
        }>, "many">;
        ranking: z.ZodArray<z.ZodObject<{
            body: z.ZodUnion<[z.ZodLiteral<"sun">, z.ZodLiteral<"moon">, z.ZodLiteral<"mercury">, z.ZodLiteral<"venus">, z.ZodLiteral<"mars">, z.ZodLiteral<"jupiter">, z.ZodLiteral<"saturn">, z.ZodLiteral<"uranus">, z.ZodLiteral<"neptune">, z.ZodLiteral<"pluto">, z.ZodLiteral<"true_node">, z.ZodLiteral<"mean_node">, z.ZodLiteral<"chiron">, z.ZodLiteral<"fortune">, z.ZodObject<{
                asteroid: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                asteroid: number;
                name?: string | undefined;
            }, {
                asteroid: number;
                name?: string | undefined;
            }>]>;
            angle: z.ZodEnum<["MC", "IC", "ASC", "DSC"]>;
            distanceKm: z.ZodNumber;
            strength: z.ZodEnum<["strong", "medium", "weak"]>;
            force: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            strength: "strong" | "medium" | "weak";
            angle: "MC" | "IC" | "ASC" | "DSC";
            distanceKm: number;
            force: number;
        }, {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            strength: "strong" | "medium" | "weak";
            angle: "MC" | "IC" | "ASC" | "DSC";
            distanceKm: number;
            force: number;
        }>, "many">;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        version: string;
        parans: {
            latitude: number;
            bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }];
            angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
            orbDeg: number;
        }[];
        city: {
            lat: number;
            lon: number;
            alt?: number | undefined;
        };
        radiusKm: number;
        active: {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            strength: "strong" | "medium" | "weak";
            angle: "MC" | "IC" | "ASC" | "DSC";
            distanceKm: number;
            force: number;
        }[];
        ranking: {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            strength: "strong" | "medium" | "weak";
            angle: "MC" | "IC" | "ASC" | "DSC";
            distanceKm: number;
            force: number;
        }[];
    }, {
        version: string;
        parans: {
            latitude: number;
            bodies: ["sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            }];
            angles: ["MC" | "IC" | "ASC" | "DSC", "MC" | "IC" | "ASC" | "DSC"];
            orbDeg: number;
        }[];
        city: {
            lat: number;
            lon: number;
            alt?: number | undefined;
        };
        radiusKm: number;
        active: {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            strength: "strong" | "medium" | "weak";
            angle: "MC" | "IC" | "ASC" | "DSC";
            distanceKm: number;
            force: number;
        }[];
        ranking: {
            body: "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "true_node" | "mean_node" | "chiron" | "fortune" | {
                asteroid: number;
                name?: string | undefined;
            };
            strength: "strong" | "medium" | "weak";
            angle: "MC" | "IC" | "ASC" | "DSC";
            distanceKm: number;
            force: number;
        }[];
    }>;
    RelocationChartResultSchema: z.ZodObject<{
        location: z.ZodObject<{
            lat: z.ZodNumber;
            lon: z.ZodNumber;
        } & {
            alt: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lon: number;
            alt?: number | undefined;
        }, {
            lat: number;
            lon: number;
            alt?: number | undefined;
        }>;
        houses: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodNumber, "many">>;
        angles: z.ZodRecord<z.ZodString, z.ZodNumber>;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        version: string;
        angles: Record<string, number>;
        location: {
            lat: number;
            lon: number;
            alt?: number | undefined;
        };
        houses: Record<string, number[]>;
    }, {
        version: string;
        angles: Record<string, number>;
        location: {
            lat: number;
            lon: number;
            alt?: number | undefined;
        };
        houses: Record<string, number[]>;
    }>;
};
type Schemas = typeof Schemas;

export { type ACGLinesResult, ACGLinesResultSchema, type Angle, type Ayanamsa, type Body, type BodyPosition, BodyPositionSchema, BodySchema, type CalculationOptions, type Coordinate, type CoordinateLine, CoordinateLineSchema, CoordinateSchema, type Crossing, type CrossingClassification, CrossingSchema, type DateTimeInput, type GeoJSONLineString, type LineStrength, type LocalSpaceLine, LocalSpaceLineSchema, type LocalSpaceResult, LocalSpaceResultSchema, type Location, type LocationAnalysisItem, LocationAnalysisItemSchema, type LocationAnalysisResult, LocationAnalysisResultSchema, type Paran, ParanSchema, type ParansResult, ParansResultSchema, type RelocationChartResult, RelocationChartResultSchema, Schemas, analyzeLocation, computeACG, computeLocalSpace, computeParans, computeRelocationChart, initEphemeris };
