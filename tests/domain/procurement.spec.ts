import { describe, expect, it } from 'vitest';

import { createIngredient } from '@/domain/catalog/ingredient';
import { calculateProcurement } from '@/domain/procurement/procurement-calculator';
import { createRecipe } from '@/domain/recipe/recipe';
import { Money } from '@/domain/shared/money';
import {
  createConversion,
  createQuantity,
  getUnit,
} from '@/domain/shared/unit';

describe('Procurement calculator', () => {
  it('aggregates ingredient demand and rounds purchase units up', () => {
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

    const result = calculateProcurement({
      planItems: [{ recipeId: recipe.id, servings: 30 }],
      recipes: [recipe],
      ingredients: [chicken, onion],
    });

    expect(result.items).toHaveLength(2);
    const chickenSummary = result.items.find(
      (item) => item.ingredientId === chicken.id,
    );
    const onionSummary = result.items.find(
      (item) => item.ingredientId === onion.id,
    );

    expect(chickenSummary?.requiredPurchaseUnits).toBe(4);
    expect(chickenSummary?.estimatedAmountMinor).toBe(3564);
    expect(chickenSummary?.stockQuantity.value).toBeCloseTo(3711.34, 2);

    expect(onionSummary?.requiredPurchaseUnits).toBe(2);
    expect(onionSummary?.estimatedAmountMinor).toBe(360);
    expect(onionSummary?.stockQuantity.value).toBeCloseTo(1530.61, 2);

    expect(result.totalCostMinor).toBe(3924);
  });
});
