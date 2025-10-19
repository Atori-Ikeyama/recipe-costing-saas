import {
  NewRecipeItemRow,
  NewRecipeRow,
  RecipeItemRow,
  RecipeRow,
} from '@/lib/db/schema/recipes';
import { createRecipe, Recipe } from '@/domain/recipe/recipe';
import { Money } from '@/domain/shared/money';
import { createQuantity } from '@/domain/shared/unit';
import { formatNumeric, parseNumeric } from './utils';

export interface RecipeComposite {
  recipe: RecipeRow;
  items: RecipeItemRow[];
}

export function toRecipeDomain(composite: RecipeComposite): Recipe {
  const { recipe, items } = composite;

  const batchOutput = createQuantity(parseNumeric(recipe.batchOutputQty), recipe.batchOutputUnit);
  const servingSize = createQuantity(parseNumeric(recipe.servingSizeQty), recipe.servingSizeUnit);

  return createRecipe({
    id: recipe.id,
    teamId: recipe.teamId,
    name: recipe.name,
    batchOutput,
    servingSize,
    platingYieldRatePercent:
      recipe.platingYieldRate !== null && recipe.platingYieldRate !== undefined
        ? parseNumeric(recipe.platingYieldRate)
        : undefined,
    sellingPrice:
      recipe.sellingPriceMinor !== null && recipe.sellingPriceMinor !== undefined
        ? Money.ofMinor(recipe.sellingPriceMinor)
        : undefined,
    sellingPriceTaxIncluded: recipe.sellingPriceTaxIncluded ?? undefined,
    sellingTaxRatePercent:
      recipe.sellingTaxRate !== null && recipe.sellingTaxRate !== undefined
        ? parseNumeric(recipe.sellingTaxRate)
        : undefined,
    version: recipe.version,
    items: items.map((item) => ({
      id: item.id,
      ingredientId: item.ingredientId,
      quantity: createQuantity(parseNumeric(item.qty), item.unit),
      wasteRate: parseNumeric(item.wasteRate),
    })),
  });
}

export function toRecipeInsertRow(recipe: Recipe): NewRecipeRow {
  return {
    teamId: recipe.teamId,
    name: recipe.name,
    batchOutputQty: formatNumeric(recipe.batchOutput.value, 3),
    batchOutputUnit: recipe.batchOutput.unit.code,
    servingSizeQty: formatNumeric(recipe.servingSize.value, 3),
    servingSizeUnit: recipe.servingSize.unit.code,
    platingYieldRate:
      recipe.platingYieldRatePercent !== undefined
        ? formatNumeric(recipe.platingYieldRatePercent, 2)
        : null,
    sellingPriceMinor: recipe.sellingPrice?.amountMinor ?? null,
    sellingPriceTaxIncluded: recipe.sellingPriceTaxIncluded ?? null,
    sellingTaxRate:
      recipe.sellingTaxRatePercent !== undefined
        ? formatNumeric(recipe.sellingTaxRatePercent, 2)
        : null,
    version: recipe.version,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function toRecipeUpdateRow(recipe: Recipe) {
  return {
    name: recipe.name,
    batchOutputQty: formatNumeric(recipe.batchOutput.value, 3),
    batchOutputUnit: recipe.batchOutput.unit.code,
    servingSizeQty: formatNumeric(recipe.servingSize.value, 3),
    servingSizeUnit: recipe.servingSize.unit.code,
    platingYieldRate:
      recipe.platingYieldRatePercent !== undefined
        ? formatNumeric(recipe.platingYieldRatePercent, 2)
        : null,
    sellingPriceMinor: recipe.sellingPrice?.amountMinor ?? null,
    sellingPriceTaxIncluded: recipe.sellingPriceTaxIncluded ?? null,
    sellingTaxRate:
      recipe.sellingTaxRatePercent !== undefined
        ? formatNumeric(recipe.sellingTaxRatePercent, 2)
        : null,
    version: recipe.version + 1,
    updatedAt: new Date(),
  };
}

export function toRecipeItemInsertRow(recipeId: number, item: Recipe['items'][number]): NewRecipeItemRow {
  return {
    recipeId,
    ingredientId: item.ingredientId,
    qty: formatNumeric(item.quantity.value, 3),
    unit: item.quantity.unit.code,
    wasteRate: formatNumeric(item.wasteRate, 4),
  };
}
