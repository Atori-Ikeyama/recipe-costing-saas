import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { ingredientToResponse } from './presenter';
import { SupplierRepository } from '@/infrastructure/repositories/supplier.repo';

const repository = new IngredientRepository();
const supplierRepository = new SupplierRepository();

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
  const [ingredients, suppliers] = await Promise.all([
    repository.listByTeam(teamId, { search }),
    supplierRepository.listByTeam(teamId),
  ]);

  const supplierMap = new Map(
    suppliers.map((supplier) => [supplier.id, supplier]),
  );

  return ingredients.map((ingredient) => {
    const supplier = ingredient.supplierId
      ? supplierMap.get(ingredient.supplierId)
      : undefined;

    return ingredientToResponse(ingredient, {
      supplierName: supplier?.name,
      supplierLeadTimeDays: supplier?.leadTimeDays,
    });
  });
}
