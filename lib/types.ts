export interface DiagramNode {
  id: string;
  label: string;
  description: string;
  /** 0 (left) – 100 (right) */
  xPercent: number;
  /** 0 (bottom) – 100 (top), standard Cartesian orientation */
  yPercent: number;
  /** Collision radius, in percent of canvas size */
  radiusPercent: number;
}

export interface CurvePoint {
  /** 0 (left) – 100 (right) */
  x: number;
  /** 0 (bottom) – 100 (top) */
  y: number;
}

export interface DiagramCurve {
  id: string;
  name: string;
  points: CurvePoint[];
}

export interface DiagramData {
  nodes: DiagramNode[];
  curves: DiagramCurve[];
}

export type DiagramSource =
  | 'vision-model'
  | 'mock-no-api-key'
  | 'mock-no-image'
  | 'mock-api-error'
  | 'mock-parse-error'
  | 'mock-invalid-schema'
  | 'mock-exception'
  | 'sample';

export interface DiagramResponse extends DiagramData {
  source?: DiagramSource;
  label?: string;
}
