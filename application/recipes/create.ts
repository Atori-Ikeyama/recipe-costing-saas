import { z } from 'zod';

import { createRecipe } from '@/domain/recipe/recipe';
import { Money } from '@/domain/shared/money';
import { createQuantity, getUnit } from '@/domain/shared/unit';
import { RecipeRepository } from '@/infrastructure/repositories/recipe.repo';
import { requireTeamContext } from '@/lib/auth/team';
import {
  moneyMinorSchema,
  percentageSchema,
  positiveNumberSchema,
  unitCodeSchema,
} from '@/lib/zod-schemas';
import { recipeToResponse } from './presenter';

const recipeItemSchema = z.object({
  ingredientId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().pipe(positiveNumberSchema),
  unit: unitCodeSchema,
  wasteRate: z.coerce.number().min(0).max(0.99),
});

const createSchema = z.object({
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
  items: z.array(recipeItemSchema).min(1, 'レシピには1件以上の材料が必要です'),
});

export type CreateRecipeInput = z.infer<typeof createSchema>;

const repository = new RecipeRepository();

export async function createRecipeEntry(input: CreateRecipeInput) {
  const data = createSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const batchOutput = createQuantity(data.batchOutputQty, data.batchOutputUnit);
  const servingSize = createQuantity(data.servingSizeQty, data.servingSizeUnit);

  const recipe = createRecipe({
    id: 0,
    teamId,
    name: data.name,
    batchOutput,
    servingSize,
    platingYieldRatePercent: data.platingYieldRatePercent,
    sellingPrice: data.sellingPriceMinor
      ? Money.ofMinor(data.sellingPriceMinor)
      : undefined,
    sellingPriceTaxIncluded: data.sellingPriceTaxIncluded,
    sellingTaxRatePercent: data.sellingTaxRatePercent,
    version: 1,
    items: data.items.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: createQuantity(item.quantity, item.unit),
      wasteRate: item.wasteRate,
    })),
  });

  const saved = await repository.create(recipe);
  return recipeToResponse(saved);
}
