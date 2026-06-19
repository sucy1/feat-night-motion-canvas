import {
  TimingFunction,
  easeInBack,
  easeInCubic,
  easeInOutCubic,
  easeInOutQuad,
  easeOutBounce,
  easeOutCubic,
  easeOutElastic,
  linear,
} from '../tweening';
import {map} from '../tweening/interpolationFunctions';
import {EPSILON, Type} from './Type';

export type BezierPoints = [number, number, number, number];

export interface EasingPreset {
  name: string;
  displayName: string;
  points: BezierPoints;
}

export const EASING_PRESETS: EasingPreset[] = [
  {
    name: 'linear',
    displayName: 'Linear',
    points: [0, 0, 1, 1],
  },
  {
    name: 'easeInOutCubic',
    displayName: 'Ease In Out Cubic',
    points: [0.645, 0.045, 0.355, 1],
  },
  {
    name: 'easeInCubic',
    displayName: 'Ease In Cubic',
    points: [0.55, 0.055, 0.675, 0.19],
  },
  {
    name: 'easeOutCubic',
    displayName: 'Ease Out Cubic',
    points: [0.215, 0.61, 0.355, 1],
  },
  {
    name: 'easeInOutQuad',
    displayName: 'Ease In Out Quad',
    points: [0.455, 0.03, 0.515, 0.955],
  },
  {
    name: 'easeOutElastic',
    displayName: 'Elastic Out',
    points: [0.68, -0.55, 0.265, 1.55],
  },
  {
    name: 'easeOutBounce',
    displayName: 'Bounce Out',
    points: [0.58, 1.8, 0.5, 1],
  },
  {
    name: 'easeInBack',
    displayName: 'Back In',
    points: [0.6, -0.28, 0.735, 0.045],
  },
];

function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;
}

function solveCubicBezierX(
  x1: number,
  x2: number,
  targetX: number,
  epsilon = 1e-6,
): number {
  let lower = 0;
  let upper = 1;
  let mid = 0.5;
  for (let i = 0; i < 100; i++) {
    const x = cubicBezier(0, x1, x2, 1, mid);
    if (Math.abs(x - targetX) < epsilon) {
      return mid;
    }
    if (x < targetX) {
      lower = mid;
    } else {
      upper = mid;
    }
    mid = (lower + upper) / 2;
  }
  return mid;
}

function evaluateBezier(
  points: BezierPoints,
  t: number,
  from = 0,
  to = 1,
): number {
  const [x1, y1, x2, y2] = points;
  const tt = solveCubicBezierX(x1, x2, t);
  const y = cubicBezier(0, y1, y2, 1, tt);
  return map(from, to, y);
}

function getPresetFunction(name: string): TimingFunction | null {
  switch (name) {
    case 'linear':
      return linear;
    case 'easeInOutCubic':
      return easeInOutCubic;
    case 'easeInCubic':
      return easeInCubic;
    case 'easeOutCubic':
      return easeOutCubic;
    case 'easeInOutQuad':
      return easeInOutQuad;
    case 'easeOutElastic':
      return easeOutElastic;
    case 'easeOutBounce':
      return easeOutBounce;
    case 'easeInBack':
      return easeInBack;
    default:
      return null;
  }
}

export type PossibleEasing =
  | Easing
  | BezierPoints
  | string
  | undefined;

export class Easing implements Type {
  public static readonly symbol = Symbol.for(
    '@motion-canvas/core/types/Easing',
  );

  public static readonly linear = new Easing(EASING_PRESETS[0]);
  public static readonly easeInOutCubic = new Easing(EASING_PRESETS[1]);

  public readonly points: BezierPoints;
  public readonly presetName: string | null;

  public constructor();
  public constructor(from: PossibleEasing);
  public constructor(x1: number, y1: number, x2: number, y2: number);

  public constructor(
    one?: PossibleEasing | number,
    two?: number,
    three?: number,
    four?: number,
  ) {
    if (one === undefined || one === null) {
      this.points = [0, 0, 1, 1];
      this.presetName = 'linear';
      return;
    }

    if (typeof one === 'number') {
      this.points = [one, two ?? 0, three ?? 1, four ?? 1];
      this.presetName = this.findPresetName(this.points);
      return;
    }

    if (typeof one === 'string') {
      const preset = EASING_PRESETS.find(p => p.name === one);
      if (preset) {
        this.points = [...preset.points] as BezierPoints;
        this.presetName = preset.name;
      } else {
        this.points = [0, 0, 1, 1];
        this.presetName = 'linear';
      }
      return;
    }

    if (Array.isArray(one)) {
      this.points = [...one] as BezierPoints;
      this.presetName = this.findPresetName(this.points);
      return;
    }

    if (one instanceof Easing) {
      this.points = [...one.points] as BezierPoints;
      this.presetName = one.presetName;
      return;
    }

    if ('name' in one && typeof one.name === 'string') {
      const preset = one as EasingPreset;
      this.points = [...preset.points] as BezierPoints;
      this.presetName = preset.name;
      return;
    }

    this.points = [0, 0, 1, 1];
    this.presetName = 'linear';
  }

  private findPresetName(points: BezierPoints): string | null {
    for (const preset of EASING_PRESETS) {
      if (
        Math.abs(preset.points[0] - points[0]) < EPSILON &&
        Math.abs(preset.points[1] - points[1]) < EPSILON &&
        Math.abs(preset.points[2] - points[2]) < EPSILON &&
        Math.abs(preset.points[3] - points[3]) < EPSILON
      ) {
        return preset.name;
      }
    }
    return null;
  }

  public static lerp(from: Easing, to: Easing, value: number): Easing {
    const points: BezierPoints = [
      map(from.points[0], to.points[0], value),
      map(from.points[1], to.points[1], value),
      map(from.points[2], to.points[2], value),
      map(from.points[3], to.points[3], value),
    ];
    return new Easing(points);
  }

  public lerp(to: Easing, value: number): Easing {
    return Easing.lerp(this, to, value);
  }

  public evaluate(t: number, from = 0, to = 1): number {
    if (this.presetName) {
      const fn = getPresetFunction(this.presetName);
      if (fn) {
        return fn(t, from, to);
      }
    }
    return evaluateBezier(this.points, t, from, to);
  }

  public toTimingFunction(): TimingFunction {
    return (t: number, from = 0, to = 1) => this.evaluate(t, from, to);
  }

  public toSymbol(): symbol {
    return Easing.symbol;
  }

  public serialize(): BezierPoints {
    return [...this.points] as BezierPoints;
  }

  public toArray(): BezierPoints {
    return [...this.points] as BezierPoints;
  }

  public toString(): string {
    return `Easing([${this.points.join(', ')}])`;
  }

  public exactlyEquals(other: Easing): boolean {
    return (
      this.points[0] === other.points[0] &&
      this.points[1] === other.points[1] &&
      this.points[2] === other.points[2] &&
      this.points[3] === other.points[3]
    );
  }

  public equals(other: Easing, threshold = EPSILON): boolean {
    return (
      Math.abs(this.points[0] - other.points[0]) <= threshold + Number.EPSILON &&
      Math.abs(this.points[1] - other.points[1]) <= threshold + Number.EPSILON &&
      Math.abs(this.points[2] - other.points[2]) <= threshold + Number.EPSILON &&
      Math.abs(this.points[3] - other.points[3]) <= threshold + Number.EPSILON
    );
  }
}
