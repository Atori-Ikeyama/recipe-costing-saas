import { describe, expect, it } from 'vitest';

import { createIngredient } from '@/domain/catalog/ingredient';
import { recipeUnitCost } from '@/domain/costing/costing-service';
import { createRecipe } from '@/domain/recipe/recipe';
import { Money } from '@/domain/shared/money';
import {
  createConversion,
  createQuantity,
  getUnit,
} from '@/domain/shared/unit';

describe('Costing service', () => {
  it('calculates batch and unit cost with yield, waste, and tax normalization', () => {
    const chicken = createIngredient({
      id: 1,
      teamId: 1,
      name: '鶏もも肉',
      purchaseQuantity: createQuantity(1, 'kg'),
      stockUnit: getUnit('g'),
      conversion: createConversion('kg', 'g', 1000),
      purchasePrice: Money.ofMinor(980),
      taxIncluded: true,
      taxRatePercent: 10,
      yieldRatePercent: 90,
      supplierId: 1,
      version: 1,
    });

    const onion = createIngredient({
      id: 2,
      teamId: 1,
      name: '玉ねぎ',
      purchaseQuantity: createQuantity(1, 'kg'),
      stockUnit: getUnit('g'),
      conversion: createConversion('kg', 'g', 1000),
      purchasePrice: Money.ofMinor(198),
      taxIncluded: true,
      taxRatePercent: 10,
      yieldRatePercent: 92,
      supplierId: 1,
      version: 1,
    });

    const recipe = createRecipe({
      id: 10,
      teamId: 1,
      name: 'チキンカレー',
      batchOutput: createQuantity(2000, 'g'),
      servingSize: createQuantity(200, 'g'),
      platingYieldRatePercent: 100,
      sellingPrice: Money.ofMinor(950),
      sellingPriceTaxIncluded: true,
      sellingTaxRatePercent: 10,
      version: 1,
      items: [
        {
          ingredientId: chicken.id,
          quantity: createQuantity(1200, 'g'),
          wasteRate: 0.03,
        },
        {
          ingredientId: onion.id,
          quantity: createQuantity(500, 'g'),
          wasteRate: 0.02,
        },
      ],
    });

    const result = recipeUnitCost(recipe, {
      [chicken.id]: chicken,
      [onion.id]: onion,
    });

    expect(result.batchCostMinor).toBe(1325);
    expect(result.unitCostMinor).toBe(133);
    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown[0]).toMatchObject({
      ingredientId: chicken.id,
      itemCostMinor: 1225,
    });
    expect(result.breakdown[1]).toMatchObject({
      ingredientId: onion.id,
      itemCostMinor: 100,
    });
  });
});
