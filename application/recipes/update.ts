import { z } from 'zod';

import { createRecipe } from '@/domain/recipe/recipe';
import { Money } from '@/domain/shared/money';
import { createQuantity } from '@/domain/shared/unit';
import { RecipeRepository } from '@/infrastructure/repositories/recipe.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { recipeToResponse } from './presenter';
import { recipePayloadSchema } from './schema';

const updateSchema = recipePayloadSchema.extend({
  id: z.coerce.number().int().positive(),
  version: z.coerce.number().int().positive(),
});

export type UpdateRecipeInput = z.infer<typeof updateSchema>;

const repository = new RecipeRepository();

export async function updateRecipeEntry(input: UpdateRecipeInput) {
  const data = updateSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const existing = await repository.findById(teamId, data.id);
  if (!existing) {
    throw new Error('レシピが見つかりません');
  }

  if (existing.version !== data.version) {
    throw new Error('最新のレシピではありません。画面を更新してください。');
  }

  const batchOutput = createQuantity(data.batchOutputQty, data.batchOutputUnit);
  const servingSize = createQuantity(data.servingSizeQty, data.servingSizeUnit);

  const updated = createRecipe({
    ...existing,
    name: data.name,
    batchOutput,
    servingSize,
    platingYieldRatePercent: data.platingYieldRatePercent,
    sellingPrice: data.sellingPriceMinor
      ? Money.ofMinor(data.sellingPriceMinor)
      : undefined,
    sellingPriceTaxIncluded: data.sellingPriceTaxIncluded,
    sellingTaxRatePercent: data.sellingTaxRatePercent,
    items: data.items.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: createQuantity(item.quantity, item.unit),
      wasteRate: item.wasteRate,
    })),
    version: existing.version,
  });

  const saved = await repository.save(updated);
  return recipeToResponse(saved);
}
