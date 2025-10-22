import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { ingredientToResponse } from './presenter';

const repository = new IngredientRepository();

type ListIngredientsOptions = {
  query?: string;
};

const MAX_QUERY_LENGTH = 140;

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

export async function listIngredients(
  options: ListIngredientsOptions = {},
) {
  const { teamId } = await requireTeamContext();
  const search = normalizeQuery(options.query);
  const ingredients = await repository.listByTeam(teamId, { search });
  return ingredients.map(ingredientToResponse);
}
