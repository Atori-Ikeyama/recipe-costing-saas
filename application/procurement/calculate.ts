import { z } from 'zod';

import { calculateProcurement as calculateDomain } from '@/domain/procurement/procurement-calculator';
import { defaultCostingPolicy } from '@/domain/costing/costing-service';
import { RecipeRepository } from '@/infrastructure/repositories/recipe.repo';
import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { nonNegativeNumberSchema } from '@/lib/zod-schemas';
import { toProcurementResponse } from './presenter';

const planItemSchema = z.object({
  recipeId: z.coerce.number().int().positive(),
  servings: z.coerce.number().pipe(nonNegativeNumberSchema),
});

const calculateSchema = z.object({
  planItems: z.array(planItemSchema),
});

export type CalculateProcurementInput = z.infer<typeof calculateSchema>;

const recipeRepository = new RecipeRepository();
const ingredientRepository = new IngredientRepository();

export async function calculateProcurement(input: CalculateProcurementInput) {
  const data = calculateSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const recipes = await recipeRepository.listByTeam(teamId);
  const ingredients = await ingredientRepository.listByTeam(teamId);

  const result = calculateDomain({
    planItems: data.planItems,
    recipes,
    ingredients,
    policy: defaultCostingPolicy,
  });

  return toProcurementResponse(result);
}
