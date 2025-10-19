import { describe, expect, it } from 'vitest';

import {
  applyConversion,
  convertQuantity,
  createConversion,
  createQuantity,
  getUnit,
  invertConversion,
} from '@/domain/shared/unit';

describe('Unit utilities', () => {
  it('rejects cross-category conversions', () => {
    expect(() => createConversion('g', 'ml', 1)).toThrowError(/category mismatch/i);
  });

  it('converts g -> kg -> g reversibly', () => {
    const quantity = createQuantity(1000, 'g');
    const conversion = createConversion('g', 'kg', 0.001);
    const toKg = applyConversion(quantity, conversion);
    expect(toKg.value).toBeCloseTo(1);
    expect(toKg.unit).toEqual(getUnit('kg'));

    const backToG = applyConversion(toKg, invertConversion(conversion));
    expect(backToG.value).toBeCloseTo(1000);
    expect(backToG.unit).toEqual(getUnit('g'));

    const direct = convertQuantity(quantity, 'kg');
    expect(direct.value).toBeCloseTo(1);
  });
});
