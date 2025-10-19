import { z } from 'zod';

import { createRecipe } from '@/domain/recipe/recipe';
import { createQuantity } from '@/domain/shared/unit';
import { RecipeRepository } from '@/infrastructure/repositories/recipe.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { positiveNumberSchema, unitCodeSchema } from '@/lib/zod-schemas';
import { recipeToResponse } from './presenter';

const addItemSchema = z.object({
  recipeId: z.coerce.number().int().positive(),
  version: z.coerce.number().int().positive(),
  ingredientId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().pipe(positiveNumberSchema),
  unit: unitCodeSchema,
  wasteRate: z.coerce.number().min(0).max(0.99),
});

export type AddRecipeItemInput = z.infer<typeof addItemSchema>;

const repository = new RecipeRepository();

export async function addRecipeItem(input: AddRecipeItemInput) {
  const data = addItemSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const existing = await repository.findById(teamId, data.recipeId);
  if (!existing) {
    throw new Error('レシピが見つかりません');
  }

  if (existing.version !== data.version) {
    throw new Error('最新のレシピではありません。画面を更新してください。');
  }

  const updated = createRecipe({
    ...existing,
    items: [
      ...existing.items,
      {
        ingredientId: data.ingredientId,
        quantity: createQuantity(data.quantity, data.unit),
        wasteRate: data.wasteRate,
      },
    ],
  });

  const saved = await repository.save(updated);
  return recipeToResponse(saved);
}
