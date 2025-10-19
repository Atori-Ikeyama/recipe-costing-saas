import { Recipe } from '@/domain/recipe/recipe';
import { RecipeCostResult } from '@/domain/costing/costing-service';

export interface RecipeItemResponse {
  id?: number;
  ingredientId: number;
  quantity: number;
  unit: string;
  wasteRate: number;
}

export interface RecipeResponse {
  id: number;
  name: string;
  batchOutputQty: number;
  batchOutputUnit: string;
  servingSizeQty: number;
  servingSizeUnit: string;
  platingYieldRatePercent?: number;
  sellingPriceMinor?: number;
  sellingPriceTaxIncluded?: boolean;
  sellingTaxRatePercent?: number;
  version: number;
  items: RecipeItemResponse[];
}

export interface RecipeWithCostResponse {
  recipe: RecipeResponse;
  cost: RecipeCostResult;
}

export function recipeToResponse(recipe: Recipe): RecipeResponse {
  return {
    id: recipe.id,
    name: recipe.name,
    batchOutputQty: recipe.batchOutput.value,
    batchOutputUnit: recipe.batchOutput.unit.code,
    servingSizeQty: recipe.servingSize.value,
    servingSizeUnit: recipe.servingSize.unit.code,
    platingYieldRatePercent: recipe.platingYieldRatePercent,
    sellingPriceMinor: recipe.sellingPrice?.amountMinor,
    sellingPriceTaxIncluded: recipe.sellingPriceTaxIncluded,
    sellingTaxRatePercent: recipe.sellingTaxRatePercent,
    version: recipe.version,
    items: recipe.items.map((item) => ({
      id: item.id,
      ingredientId: item.ingredientId,
      quantity: item.quantity.value,
      unit: item.quantity.unit.code,
      wasteRate: item.wasteRate,
    })),
  };
}
