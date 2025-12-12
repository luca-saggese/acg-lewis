export type Coordinate = { lat: number; lon: number };

export type CoordinateLine = {
  kind: 'MC' | 'IC' | 'ASC' | 'DSC' | 'LOCAL_SPACE' | 'CROSSING';
  body: Body;
  coordinates: Coordinate[];
  geojson?: GeoJSONLineString;
  strength?: LineStrength;
  metadata?: Record<string, unknown>;
};

export type CrossingClassification = 'real' | 'pseudo';

export type Crossing = {
  at: Coordinate;
  lines: [CoordinateLine, CoordinateLine];
  classification: CrossingClassification;
};

export type LineStrength = 'strong' | 'medium' | 'weak';

export type Body =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'true_node'
  | 'mean_node'
  | 'chiron'
  | 'fortune'
  | { asteroid: number; name?: string };

export type Angle = 'MC' | 'IC' | 'ASC' | 'DSC';

export type Ayanamsa =
  | 'lahiri'
  | 'krishnamurti'
  | 'raman'
  | 'fagan_bradley'
  | 'yukteshwar'
  | 'true_citra'
  | 'user';

export interface DateTimeInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  timezone?: string; // IANA or offset like "+02:00"
  dstMinutes?: number; // optional DST override in minutes
  calendar?: 'gregorian' | 'julian';
}

export interface Location {
  lat: number; // degrees
  lon: number; // degrees, east positive
  alt?: number; // meters
}

export interface CalculationOptions {
  system?: 'tropical' | 'sidereal';
  ayanamsa?: Ayanamsa;
  angularOrbDeg?: number; // default 1 deg
  geoOrbKm?: number; // width of influence band for geo strength
  samplingStepDeg?: number; // grid step for ASC/DSC lines
  refractAscDsc?: boolean;
  moonParallax?: boolean;
  ephemerisPath?: string;
  cache?: boolean;
  parallel?: boolean;
}

export interface BodyPosition {
  body: Body;
  jd: number;
  ra: number; // hours
  dec: number; // degrees
  eclipticLon: number; // degrees
  eclipticLat: number; // degrees
  distanceAU: number;
  lst: number; // local sidereal time hours (for provided location) when applicable
}

export interface ACGLinesResult {
  timestamp: string;
  gst: number;
  bodies: BodyPosition[];
  lines: CoordinateLine[];
  crossings: Crossing[];
  version: string;
  options: CalculationOptions;
}

export interface Paran {
  latitude: number;
  bodies: [Body, Body];
  angles: [Angle, Angle];
  orbDeg: number;
}

export interface ParansResult {
  parans: Paran[];
  version: string;
}

export interface LocalSpaceLine {
  body: Body;
  bearing: number; // degrees from North
  coordinates: Coordinate[];
}

export interface LocalSpaceResult {
  origin: Location;
  lines: LocalSpaceLine[];
  version: string;
}

export interface RelocationChartResult {
  location: Location;
  houses: Record<string, number[]>; // system -> cusps
  angles: Record<'ASC' | 'MC' | 'IC' | 'DSC', number>;
  version: string;
}

export interface LocationAnalysisItem {
  body: Body;
  angle: Angle;
  distanceKm: number;
  strength: LineStrength;
  force: number;
}

export interface LocationAnalysisResult {
  city: Location;
  radiusKm: number;
  active: LocationAnalysisItem[];
  parans: Paran[];
  ranking: LocationAnalysisItem[];
  version: string;
}

export type GeoJSONLineString = {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: Array<[number, number]>; // lon, lat
  };
  properties?: Record<string, unknown>;
};
