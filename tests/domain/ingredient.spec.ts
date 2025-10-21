import { describe, expect, it } from 'vitest';

import {
  createIngredient,
  purchaseQuantityInStockUnits,
} from '@/domain/catalog/ingredient';
import { Money } from '@/domain/shared/money';
import { ValidationError } from '@/domain/shared/errors';
import {
  createConversion,
  createQuantity,
  getUnit,
} from '@/domain/shared/unit';

function buildIngredient(overrides: Partial<Parameters<typeof createIngredient>[0]> = {}) {
  return createIngredient({
    id: 1,
    teamId: 7,
    name: '牛肩ロース',
    purchaseQuantity: createQuantity(1, 'kg'),
    stockUnit: getUnit('g'),
    conversion: createConversion('kg', 'g', 1000),
    purchasePrice: Money.ofMinor(2480),
    yieldRatePercent: 93,
    supplierId: 42,
    version: 1,
    ...overrides,
  });
}

describe('Ingredient domain', () => {
  it('材料を生成し仕入れ数量を在庫単位へ換算できる', () => {
    const ingredient = buildIngredient();

    const converted = purchaseQuantityInStockUnits(ingredient);

    expect(converted.value).toBe(1000);
    expect(converted.unit).toEqual(getUnit('g'));
  });

  it('yield rate が範囲外の場合は例外を投げる', () => {
    expect(() =>
      buildIngredient({
        yieldRatePercent: 0,
      }),
    ).toThrowError(ValidationError);
  });

  it('転換先単位が不一致の場合は例外を投げる', () => {
    expect(() =>
      buildIngredient({
        stockUnit: getUnit('ml'),
      }),
    ).toThrowError(/Conversion target/);
  });

  it('teamId が不正な場合は例外を投げる', () => {
    expect(() =>
      buildIngredient({
        teamId: 0,
      }),
    ).toThrowError(ValidationError);
  });
});
