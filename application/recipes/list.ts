import { RecipeRepository } from '@/infrastructure/repositories/recipe.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { recipeToResponse } from './presenter';

const repository = new RecipeRepository();

export async function listRecipes() {
  const { teamId } = await requireTeamContext();
  const recipes = await repository.listByTeam(teamId);
  return recipes.map(recipeToResponse);
}
