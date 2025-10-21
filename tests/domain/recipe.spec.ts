import { describe, expect, it } from 'vitest';

import {
  createRecipe,
  servingsPerBatch,
} from '@/domain/recipe/recipe';
import { ValidationError } from '@/domain/shared/errors';
import { Money } from '@/domain/shared/money';
import { createQuantity } from '@/domain/shared/unit';

const baseItem = {
  ingredientId: 11,
  quantity: createQuantity(500, 'g'),
  wasteRate: 0.05,
};

describe('Recipe domain', () => {
  it('レシピを生成し盛付歩留まりを考慮した提供数を算出できる', () => {
    const recipe = createRecipe({
      id: 3,
      teamId: 12,
      name: '自家製ハンバーグ',
      batchOutput: createQuantity(3, 'kg'),
      servingSize: createQuantity(150, 'g'),
      platingYieldRatePercent: 85,
      sellingPrice: Money.ofMinor(980),
      sellingPriceTaxIncluded: true,
      sellingTaxRatePercent: 10,
      version: 1,
      items: [{ ...baseItem }],
    });

    const servings = servingsPerBatch(recipe);
    expect(servings).toBeCloseTo(17, 4); // 3000g * 0.85 / 150g
  });

  it('材料が空の場合は例外を投げる', () => {
    expect(() =>
      createRecipe({
        id: 5,
        teamId: 99,
        name: 'テストレシピ',
        batchOutput: createQuantity(10, 'kg'),
        servingSize: createQuantity(1, 'kg'),
        version: 1,
        items: [],
      }),
    ).toThrowError(/at least one ingredient/i);
  });

  it('提供単位のカテゴリが異なる場合は例外を投げる', () => {
    expect(() =>
      createRecipe({
        id: 6,
        teamId: 1,
        name: '不正なレシピ',
        batchOutput: createQuantity(10, 'kg'),
        servingSize: createQuantity(1, 'l'),
        version: 1,
        items: [{ ...baseItem }],
      }),
    ).toThrowError(/Unit category mismatch/);
  });

  it('税率が範囲外の場合は例外を投げる', () => {
    expect(() =>
      createRecipe({
        id: 7,
        teamId: 2,
        name: '税率不正',
        batchOutput: createQuantity(10, 'kg'),
        servingSize: createQuantity(1000, 'g'),
        sellingTaxRatePercent: 120,
        version: 1,
        items: [{ ...baseItem }],
      }),
    ).toThrowError(ValidationError);
  });
});
