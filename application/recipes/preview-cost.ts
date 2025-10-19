import { z } from 'zod';

import { createRecipe } from '@/domain/recipe/recipe';
import { Money } from '@/domain/shared/money';
import { createQuantity } from '@/domain/shared/unit';
import { recipeUnitCost, defaultCostingPolicy } from '@/domain/costing/costing-service';
import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';
import {
  moneyMinorSchema,
  percentageSchema,
  positiveNumberSchema,
  unitCodeSchema,
} from '@/lib/zod-schemas';
import { recipeToResponse } from './presenter';

const itemSchema = z.object({
  ingredientId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().pipe(positiveNumberSchema),
  unit: unitCodeSchema,
  wasteRate: z.coerce.number().min(0).max(0.99),
});

const previewSchema = z.object({
  name: z.string().min(1).max(160),
  batchOutputQty: z.coerce.number().pipe(positiveNumberSchema),
  batchOutputUnit: unitCodeSchema,
  servingSizeQty: z.coerce.number().pipe(positiveNumberSchema),
  servingSizeUnit: unitCodeSchema,
  platingYieldRatePercent: z
    .coerce.number()
    .optional()
    .refine(
      (val) => val === undefined || (val > 0 && val <= 100),
      '盛付歩留まりは0より大きく100以下で指定してください',
    ),
  sellingPriceMinor: z.coerce.number().pipe(moneyMinorSchema).optional(),
  sellingPriceTaxIncluded: z.coerce.boolean().optional(),
  sellingTaxRatePercent: z.coerce.number().pipe(percentageSchema).optional(),
  items: z.array(itemSchema).min(1),
});

export type PreviewRecipeInput = z.infer<typeof previewSchema>;

const ingredientRepository = new IngredientRepository();

export async function previewRecipeCost(input: PreviewRecipeInput) {
  const data = previewSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const recipe = createRecipe({
    id: 0,
    teamId,
    name: data.name,
    batchOutput: createQuantity(data.batchOutputQty, data.batchOutputUnit),
    servingSize: createQuantity(data.servingSizeQty, data.servingSizeUnit),
    platingYieldRatePercent: data.platingYieldRatePercent,
    sellingPrice: data.sellingPriceMinor ? Money.ofMinor(data.sellingPriceMinor) : undefined,
    sellingPriceTaxIncluded: data.sellingPriceTaxIncluded,
    sellingTaxRatePercent: data.sellingTaxRatePercent,
    version: 1,
    items: data.items.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: createQuantity(item.quantity, item.unit),
      wasteRate: item.wasteRate,
    })),
  });

  const ingredientIds = [...new Set(recipe.items.map((item) => item.ingredientId))];

  const ingredients = await Promise.all(
    ingredientIds.map((id) => ingredientRepository.findById(teamId, id)),
  );

  if (ingredients.some((ingredient) => !ingredient)) {
    throw new Error('必要な材料が見つかりません');
  }

  const map = new Map(
    ingredients
      .filter((ingredient): ingredient is NonNullable<typeof ingredient> => Boolean(ingredient))
      .map((ingredient) => [ingredient.id, ingredient]),
  );

  const cost = recipeUnitCost(recipe, map, defaultCostingPolicy);

  return {
    recipe: recipeToResponse(recipe),
    cost,
  };
}
