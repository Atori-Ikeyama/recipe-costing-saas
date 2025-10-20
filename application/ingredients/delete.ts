import { z } from 'zod';

import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';

const deleteSchema = z.object({
  id: z.coerce.number().int().positive(),
  version: z.coerce.number().int().positive(),
});

export type DeleteIngredientInput = z.infer<typeof deleteSchema>;

const repository = new IngredientRepository();

export async function deleteIngredient(input: DeleteIngredientInput) {
  const data = deleteSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const existing = await repository.findById(teamId, data.id);
  if (!existing) {
    throw new Error('材料が見つかりません');
  }

  if (existing.version !== data.version) {
    throw new Error('最新の材料データではありません。画面を更新してください。');
  }

  await repository.delete(teamId, data.id, data.version);
}
