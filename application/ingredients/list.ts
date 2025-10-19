import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { ingredientToResponse } from './presenter';

const repository = new IngredientRepository();

export async function listIngredients() {
  const { teamId } = await requireTeamContext();
  const ingredients = await repository.listByTeam(teamId);
  return ingredients.map(ingredientToResponse);
}
