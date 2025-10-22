import { z } from 'zod';

import { RecipeRepository } from '@/infrastructure/repositories/recipe.repo';
import { requireTeamContext } from '@/lib/auth/team';

const deleteSchema = z.object({
  id: z.coerce.number().int().positive(),
  version: z.coerce.number().int().positive(),
});

export type DeleteRecipeInput = z.infer<typeof deleteSchema>;

const repository = new RecipeRepository();

export async function deleteRecipe(input: DeleteRecipeInput) {
  const data = deleteSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const existing = await repository.findById(teamId, data.id);
  if (!existing) {
    throw new Error('レシピが見つかりません');
  }

  if (existing.version !== data.version) {
    throw new Error(
      '最新のレシピデータではありません。画面を更新してください。',
    );
  }

  await repository.delete(teamId, data.id, data.version);
}
