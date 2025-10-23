import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { ingredientToResponse } from './presenter';
import { SupplierRepository } from '@/infrastructure/repositories/supplier.repo';

const repository = new IngredientRepository();
const supplierRepository = new SupplierRepository();

export async function getIngredient(id: number) {
  const { teamId } = await requireTeamContext();
  const ingredient = await repository.findById(teamId, id);
  if (!ingredient) {
    throw new Error('材料が見つかりません');
  }

  const supplier = ingredient.supplierId
    ? await supplierRepository.findById(teamId, ingredient.supplierId)
    : undefined;

  return ingredientToResponse(ingredient, {
    supplierName: supplier?.name,
    supplierLeadTimeDays: supplier?.leadTimeDays,
  });
}
