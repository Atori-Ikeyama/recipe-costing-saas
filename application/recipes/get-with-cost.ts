import { RecipeRepository } from '@/infrastructure/repositories/recipe.repo';
import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { ingredientToResponse } from '../ingredients/presenter';
import { recipeToResponse } from './presenter';
import { recipeUnitCost, defaultCostingPolicy } from '@/domain/costing/costing-service';

const recipeRepository = new RecipeRepository();
const ingredientRepository = new IngredientRepository();

export async function getRecipeWithCost(id: number) {
  const { teamId } = await requireTeamContext();
  const recipe = await recipeRepository.findById(teamId, id);
  if (!recipe) {
    throw new Error('レシピが見つかりません');
  }

  const ingredients = await ingredientRepository.listByTeam(teamId);
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  const cost = recipeUnitCost(recipe, ingredientMap, defaultCostingPolicy);

  return {
    recipe: recipeToResponse(recipe),
    ingredients: ingredients.map(ingredientToResponse),
    cost,
  };
}
