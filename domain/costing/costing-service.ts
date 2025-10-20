import { Ingredient } from '../catalog/ingredient';
import { Recipe, RecipeItem, servingsPerBatch } from '../recipe/recipe';
import { Money, RoundingPolicy, roundHalfUp } from '../shared/money';
import {
  Conversion,
  Quantity,
  applyConversion,
  convertQuantity,
} from '../shared/unit';
import { ValidationError } from '../shared/errors';

export interface CostingPolicy {
  round: RoundingPolicy;
}

export const defaultCostingPolicy: CostingPolicy = {
  round: roundHalfUp,
};

export interface EffectiveUnitCostInput {
  purchasePrice: Money;
  purchaseQty: Quantity;
  conversion: Conversion;
  yieldRatePercent: number;
}

export interface RecipeCostResult {
  unitCostMinor: number;
  batchCostMinor: number;
  portionsPerBatch: number;
  breakdown: Array<{
    ingredientId: number;
    itemCostMinor: number;
    actualQty: number;
  }>;
}

export function effectiveUnitCost({
  purchasePrice,
  purchaseQty,
  conversion,
  yieldRatePercent,
}: EffectiveUnitCostInput): number {
  if (yieldRatePercent <= 0 || yieldRatePercent > 100) {
    throw new ValidationError('Yield rate must be within (0, 100]');
  }

  const stockQuantity = applyConversion(purchaseQty, conversion);
  const base = purchasePrice.amountMinor / stockQuantity.value;
  return base / (yieldRatePercent / 100);
}

export function recipeUnitCost(
  recipe: Recipe,
  ingredients: Map<number, Ingredient> | Record<number, Ingredient>,
  policy: CostingPolicy = defaultCostingPolicy,
): RecipeCostResult {
  const round = policy.round ?? roundHalfUp;
  const portionCount = servingsPerBatch(recipe);

  if (!Number.isFinite(portionCount) || portionCount <= 0) {
    throw new ValidationError('Recipe portions per batch must be positive');
  }

  let batchCost = 0;
  const breakdown: RecipeCostResult['breakdown'] = [];

  for (const item of recipe.items) {
    const ingredient = lookupIngredient(ingredients, item.ingredientId);
    const unitCost = effectiveUnitCost({
      purchasePrice: ingredient.purchasePrice,
      purchaseQty: ingredient.purchaseQuantity,
      conversion: ingredient.conversion,
      yieldRatePercent: ingredient.yieldRatePercent,
    });

    const qtyInStockUnit = convertQuantity(item.quantity, ingredient.stockUnit);
    const actualQty = qtyInStockUnit.value / (1 - item.wasteRate);
    const itemCost = round(actualQty * unitCost);

    batchCost += itemCost;
    breakdown.push({
      ingredientId: item.ingredientId,
      itemCostMinor: itemCost,
      actualQty,
    });
  }

  const unitCostMinor = round(batchCost / portionCount);

  return {
    unitCostMinor,
    batchCostMinor: batchCost,
    portionsPerBatch: portionCount,
    breakdown,
  };
}

function lookupIngredient(
  collection: Map<number, Ingredient> | Record<number, Ingredient>,
  id: number,
): Ingredient {
  const ingredient =
    collection instanceof Map ? collection.get(id) : collection[id];

  if (!ingredient) {
    throw new ValidationError(`Ingredient ${id} not found in costing context`);
  }

  return ingredient;
}
