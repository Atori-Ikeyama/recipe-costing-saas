import { RecipeRepository } from '@/infrastructure/repositories/recipe.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { recipeToResponse } from './presenter';

const repository = new RecipeRepository();

type ListRecipesOptions = {
  query?: string;
};

const MAX_QUERY_LENGTH = 160;

const normalizeQuery = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed.slice(0, MAX_QUERY_LENGTH);
};

export async function listRecipes(options: ListRecipesOptions = {}) {
  const { teamId } = await requireTeamContext();
  const search = normalizeQuery(options.query);
  const recipes = await repository.listByTeam(teamId, { search });
  return recipes.map(recipeToResponse);
}
