import { DiagramData, CurvePoint } from './types';

/**
 * Generates points for a symmetric parabola y = x^2, normalized into
 * the 0-100 Cartesian percent space used throughout the app.
 * Vertex sits low-center; both branches rise toward the top corners.
 */
function generateParabolaPoints(steps = 24): CurvePoint[] {
  const points: CurvePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100;
    const u = (x - 50) / 50; // -1 .. 1
    const y = 10 + 75 * u * u; // 10 (vertex) .. 85 (branches)
    points.push({ x, y: Math.min(92, y) });
  }
  return points;
}

/** Traces a rectangular wire loop connecting battery -> resistor -> LED -> back to battery. */
function generateCircuitLoopPoints(): CurvePoint[] {
  return [
    { x: 15, y: 50 },
    { x: 15, y: 85 },
    { x: 50, y: 85 },
    { x: 85, y: 85 },
    { x: 85, y: 50 },
    { x: 85, y: 15 },
    { x: 50, y: 15 },
    { x: 15, y: 15 },
    { x: 15, y: 50 },
  ];
}

/** Traces an elliptical cell-membrane boundary. */
function generateMembranePoints(steps = 28): CurvePoint[] {
  const points: CurvePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const x = 50 + 44 * Math.cos(theta);
    const y = 50 + 40 * Math.sin(theta);
    points.push({ x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) });
  }
  return points;
}

export interface MockDiagramEntry {
  key: string;
  label: string;
  description: string;
  data: DiagramData;
}

export const MOCK_DIAGRAMS: Record<string, MockDiagramEntry> = {
  parabola: {
    key: 'parabola',
    label: 'Graph: y = x²',
    description: 'A symmetric parabola with its vertex at the origin.',
    data: {
      nodes: [
        {
          id: 'vertex',
          label: 'Vertex',
          description:
            'The minimum point of the parabola, sitting at the origin where the curve changes direction.',
          xPercent: 50,
          yPercent: 10,
          radiusPercent: 7,
        },
        {
          id: 'left-branch',
          label: 'Left branch',
          description:
            'The curve rises steeply moving left, showing rapid growth as x becomes more negative.',
          xPercent: 12,
          yPercent: 88,
          radiusPercent: 7,
        },
        {
          id: 'right-branch',
          label: 'Right branch',
          description:
            'The curve rises steeply moving right, mirroring the left branch symmetrically.',
          xPercent: 88,
          yPercent: 88,
          radiusPercent: 7,
        },
        {
          id: 'y-axis',
          label: 'Y axis',
          description: 'The vertical axis, running through the vertex of the parabola.',
          xPercent: 50,
          yPercent: 50,
          radiusPercent: 5,
        },
      ],
      curves: [
        { id: 'parabola-curve', name: 'y equals x squared', points: generateParabolaPoints() },
      ],
    },
  },
  circuit: {
    key: 'circuit',
    label: 'Series Circuit',
    description: 'A battery, resistor, and LED wired in a single loop.',
    data: {
      nodes: [
        {
          id: 'battery',
          label: 'Battery',
          description: 'A 9 volt battery supplies current to the circuit loop.',
          xPercent: 15,
          yPercent: 50,
          radiusPercent: 8,
        },
        {
          id: 'resistor',
          label: 'Resistor',
          description: 'A 220 ohm resistor limits current flowing to the LED, protecting it from burning out.',
          xPercent: 50,
          yPercent: 85,
          radiusPercent: 8,
        },
        {
          id: 'led',
          label: 'LED',
          description: 'A light emitting diode lights up when current flows through it in the forward direction.',
          xPercent: 85,
          yPercent: 50,
          radiusPercent: 8,
        },
        {
          id: 'ground-wire',
          label: 'Return wire',
          description: 'The bottom wire that returns current from the LED back to the battery, completing the loop.',
          xPercent: 50,
          yPercent: 15,
          radiusPercent: 7,
        },
      ],
      curves: [
        { id: 'circuit-loop', name: 'the circuit wire path', points: generateCircuitLoopPoints() },
      ],
    },
  },
  biology: {
    key: 'biology',
    label: 'Animal Cell',
    description: 'A labeled animal cell with its major organelles.',
    data: {
      nodes: [
        {
          id: 'nucleus',
          label: 'Nucleus',
          description: 'The control center of the cell, containing DNA that directs all cellular activity.',
          xPercent: 50,
          yPercent: 55,
          radiusPercent: 11,
        },
        {
          id: 'mitochondria',
          label: 'Mitochondria',
          description: 'The powerhouse of the cell, converting nutrients into usable energy through respiration.',
          xPercent: 25,
          yPercent: 68,
          radiusPercent: 7,
        },
        {
          id: 'chloroplast-analog',
          label: 'Golgi apparatus',
          description: 'Packages and ships proteins to their destinations inside and outside the cell.',
          xPercent: 74,
          yPercent: 30,
          radiusPercent: 7,
        },
        {
          id: 'vacuole',
          label: 'Vacuole',
          description: 'A fluid-filled sac that stores water, nutrients, and waste products for the cell.',
          xPercent: 30,
          yPercent: 25,
          radiusPercent: 6,
        },
        {
          id: 'membrane',
          label: 'Cell membrane',
          description:
            'The outer boundary of the cell, controlling what materials move in and out.',
          xPercent: 6,
          yPercent: 50,
          radiusPercent: 5,
        },
      ],
      curves: [
        { id: 'membrane-outline', name: 'the cell membrane boundary', points: generateMembranePoints() },
      ],
    },
  },
};

export function pickRandomMock(): DiagramData {
  const keys = Object.keys(MOCK_DIAGRAMS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return MOCK_DIAGRAMS[key].data;
}

export function getMockByKey(key: string): DiagramData | null {
  return MOCK_DIAGRAMS[key]?.data ?? null;
}
