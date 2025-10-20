import { Ingredient } from '../catalog/ingredient';
import { Recipe, servingsPerBatch } from '../recipe/recipe';
import { CostingPolicy, defaultCostingPolicy } from '../costing/costing-service';
import {
  Quantity,
  applyConversion,
  convertQuantity,
  scaleQuantity,
} from '../shared/unit';
import { ValidationError } from '../shared/errors';

export interface ProcurementPlanItem {
  recipeId: number;
  servings: number;
}

export interface ProcurementInput {
  planItems: ProcurementPlanItem[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  policy?: CostingPolicy;
}

export interface ProcurementItemResult {
  ingredientId: number;
  stockQuantity: Quantity;
  purchaseQuantity: Quantity;
  requiredPurchaseUnits: number;
  estimatedAmountMinor: number;
}

export interface ProcurementResult {
  items: ProcurementItemResult[];
  totalCostMinor: number;
}

export function calculateProcurement(
  input: ProcurementInput,
): ProcurementResult {
  const policy = input.policy ?? defaultCostingPolicy;

  const ingredientMap = new Map<number, Ingredient>();
  for (const ingredient of input.ingredients) {
    ingredientMap.set(ingredient.id, ingredient);
  }

  const recipeMap = new Map<number, Recipe>();
  for (const recipe of input.recipes) {
    recipeMap.set(recipe.id, recipe);
  }

  const totals = new Map<number, number>();

  for (const planItem of input.planItems) {
    const recipe = recipeMap.get(planItem.recipeId);
    if (!recipe) {
      throw new ValidationError(`Recipe ${planItem.recipeId} not found`);
    }

    if (!Number.isFinite(planItem.servings) || planItem.servings < 0) {
      throw new ValidationError('Servings must be a non-negative number');
    }

    if (planItem.servings === 0) {
      continue;
    }

    const portionCount = servingsPerBatch(recipe);
    if (portionCount <= 0) {
      throw new ValidationError('Recipe portions per batch must be positive');
    }

    const batchMultiplier = planItem.servings / portionCount;

    for (const item of recipe.items) {
      const ingredient = ingredientMap.get(item.ingredientId);
      if (!ingredient) {
        throw new ValidationError(
          `Ingredient ${item.ingredientId} missing for procurement calculation`,
        );
      }

      const qtyInStock = convertQuantity(item.quantity, ingredient.stockUnit);
      const actualQtyPerBatch = qtyInStock.value / (1 - item.wasteRate);
      const totalQty = actualQtyPerBatch * batchMultiplier;

      const current = totals.get(ingredient.id) ?? 0;
      totals.set(ingredient.id, current + totalQty);
    }
  }

  let totalCostMinor = 0;
  const results: ProcurementItemResult[] = [];

  for (const [ingredientId, totalStockQty] of totals.entries()) {
    const ingredient = ingredientMap.get(ingredientId);
    if (!ingredient) {
      continue;
    }

    const purchaseQtyStock = applyConversion(
      ingredient.purchaseQuantity,
      ingredient.conversion,
    );
    const unitsNeeded = totalStockQty / purchaseQtyStock.value;
    const requiredPurchaseUnits = Math.ceil(unitsNeeded);

    const estimatedAmountMinor =
      requiredPurchaseUnits > 0
        ? policy.round(ingredient.purchasePrice.amountMinor * requiredPurchaseUnits)
        : 0;

    totalCostMinor += estimatedAmountMinor;

    results.push({
      ingredientId,
      stockQuantity: {
        value: totalStockQty,
        unit: ingredient.stockUnit,
      },
      purchaseQuantity: scaleQuantity(
        ingredient.purchaseQuantity,
        requiredPurchaseUnits,
      ),
      requiredPurchaseUnits,
      estimatedAmountMinor,
    });
  }

  return {
    items: results,
    totalCostMinor,
  };
}
