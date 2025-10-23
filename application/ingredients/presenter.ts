import { Ingredient } from '@/domain/catalog/ingredient';

export interface IngredientResponse {
  id: number;
  name: string;
  purchaseUnit: string;
  purchaseQty: number;
  purchasePriceMinor: number;
  stockUnit: string;
  convPurchaseToStock: number;
  yieldRatePercent: number;
  supplierId?: number;
  supplierName?: string;
  supplierLeadTimeDays?: number;
  version: number;
}

type IngredientResponseExtras = {
  supplierName?: string;
  supplierLeadTimeDays?: number;
};

export function ingredientToResponse(
  ingredient: Ingredient,
  extras: IngredientResponseExtras = {},
): IngredientResponse {
  return {
    id: ingredient.id,
    name: ingredient.name,
    purchaseUnit: ingredient.purchaseQuantity.unit.code,
    purchaseQty: ingredient.purchaseQuantity.value,
    purchasePriceMinor: ingredient.purchasePrice.amountMinor,
    stockUnit: ingredient.stockUnit.code,
    convPurchaseToStock: ingredient.conversion.factor,
    yieldRatePercent: ingredient.yieldRatePercent,
    supplierId: ingredient.supplierId,
    supplierName: extras.supplierName,
    supplierLeadTimeDays: extras.supplierLeadTimeDays,
    version: ingredient.version,
  };
}
