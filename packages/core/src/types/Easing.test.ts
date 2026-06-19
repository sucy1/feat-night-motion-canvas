import {EASING_PRESETS, Easing} from './Easing';
import {describe, expect, test} from 'vitest';

describe('Easing', () => {
  test('Can be constructed with default values', () => {
    const easing = new Easing();
    expect(easing.points).toEqual([0, 0, 1, 1]);
    expect(easing.presetName).toBe('linear');
  });

  test('Can be constructed from preset name', () => {
    const easing = new Easing('easeInOutCubic');
    expect(easing.presetName).toBe('easeInOutCubic');
    expect(easing.points[0]).toBeCloseTo(0.645);
    expect(easing.points[1]).toBeCloseTo(0.045);
    expect(easing.points[2]).toBeCloseTo(0.355);
    expect(easing.points[3]).toBeCloseTo(1);
  });

  test('Can be constructed from bezier points', () => {
    const easing = new Easing(0.5, 0.1, 0.5, 0.9);
    expect(easing.points).toEqual([0.5, 0.1, 0.5, 0.9]);
    expect(easing.presetName).toBeNull();
  });

  test('Can be constructed from bezier points array', () => {
    const easing = new Easing([0.25, 0.1, 0.25, 1]);
    expect(easing.points).toEqual([0.25, 0.1, 0.25, 1]);
  });

  test('Can be constructed from another Easing instance', () => {
    const original = new Easing('easeInCubic');
    const copy = new Easing(original);
    expect(copy.points).toEqual(original.points);
    expect(copy.presetName).toBe(original.presetName);
  });

  test('Linear preset evaluates correctly', () => {
    const easing = new Easing('linear');
    expect(easing.evaluate(0)).toBeCloseTo(0);
    expect(easing.evaluate(0.5)).toBeCloseTo(0.5);
    expect(easing.evaluate(1)).toBeCloseTo(1);
  });

  test('Evaluate with from/to range', () => {
    const easing = new Easing('linear');
    expect(easing.evaluate(0, 10, 20)).toBeCloseTo(10);
    expect(easing.evaluate(0.5, 10, 20)).toBeCloseTo(15);
    expect(easing.evaluate(1, 10, 20)).toBeCloseTo(20);
  });

  test('toTimingFunction returns callable function', () => {
    const easing = new Easing('linear');
    const fn = easing.toTimingFunction();
    expect(typeof fn).toBe('function');
    expect(fn(0.5)).toBeCloseTo(0.5);
  });

  test('Lerp between two easings', () => {
    const from = new Easing('linear');
    const to = new Easing(0, 1, 1, 0);
    const mid = Easing.lerp(from, to, 0.5);
    expect(mid.points[0]).toBeCloseTo(0);
    expect(mid.points[1]).toBeCloseTo(0.5);
    expect(mid.points[2]).toBeCloseTo(1);
    expect(mid.points[3]).toBeCloseTo(0.5);
  });

  test('Serialize returns bezier points', () => {
    const easing = new Easing(0.2, 0.3, 0.4, 0.5);
    const serialized = easing.serialize();
    expect(serialized).toEqual([0.2, 0.3, 0.4, 0.5]);
  });

  test('Exact and approximate equality checks', () => {
    const a = new Easing('easeInOutCubic');
    const b = new Easing(EASING_PRESETS[1].points);
    const c = new Easing([0.6450001, 0.045, 0.355, 1]);

    expect(a.exactlyEquals(b)).toBe(true);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(true);
    expect(a.exactlyEquals(c)).toBe(false);
  });

  test('Custom bezier points evaluate monotonically for typical curves', () => {
    const easing = new Easing(0.25, 0.1, 0.25, 1);
    let prev = -Infinity;
    for (let t = 0; t <= 1; t += 0.01) {
      const val = easing.evaluate(t);
      expect(val).toBeGreaterThanOrEqual(prev - 0.001);
      prev = val;
    }
  });

  test('Static presets exist', () => {
    expect(Easing.linear).toBeInstanceOf(Easing);
    expect(Easing.easeInOutCubic).toBeInstanceOf(Easing);
    expect(Easing.linear.presetName).toBe('linear');
    expect(Easing.easeInOutCubic.presetName).toBe('easeInOutCubic');
  });

  test('toSymbol returns Easing symbol', () => {
    const easing = new Easing();
    expect(easing.toSymbol()).toBe(Easing.symbol);
  });

  test('toString returns readable representation', () => {
    const easing = new Easing(0.1, 0.2, 0.8, 0.9);
    expect(easing.toString()).toContain('Easing');
    expect(easing.toString()).toContain('0.1');
    expect(easing.toString()).toContain('0.9');
  });

  test('All 8 presets can be constructed', () => {
    expect(EASING_PRESETS.length).toBe(8);
    for (const preset of EASING_PRESETS) {
      const easing = new Easing(preset.name);
      expect(easing.presetName).toBe(preset.name);
      expect(typeof easing.evaluate(0.5)).toBe('number');
    }
  });
});
