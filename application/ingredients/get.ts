import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { ingredientToResponse } from './presenter';

const repository = new IngredientRepository();

export async function getIngredient(id: number) {
  const { teamId } = await requireTeamContext();
  const ingredient = await repository.findById(teamId, id);
  if (!ingredient) {
    throw new Error('材料が見つかりません');
  }

  return ingredientToResponse(ingredient);
}
