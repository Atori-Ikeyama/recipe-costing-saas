import {
  IngredientRow,
  NewIngredientRow,
} from '@/lib/db/schema/ingredients';
import { createIngredient, Ingredient } from '@/domain/catalog/ingredient';
import { Money } from '@/domain/shared/money';
import {
  createConversion,
  createQuantity,
  getUnit,
} from '@/domain/shared/unit';
import { formatNumeric, parseNumeric } from './utils';

export function toIngredientDomain(row: IngredientRow): Ingredient {
  const purchaseUnit = getUnit(row.purchaseUnit);
  const stockUnit = getUnit(row.stockUnit);

  const purchaseQty = createQuantity(parseNumeric(row.purchaseQty), purchaseUnit);
  const conversion = createConversion(
    purchaseUnit,
    stockUnit,
    parseNumeric(row.convPurchaseToStock),
  );

  return createIngredient({
    id: row.id,
    teamId: row.teamId,
    name: row.name,
    purchaseQuantity: purchaseQty,
    stockUnit,
    conversion,
    purchasePrice: Money.ofMinor(row.purchasePriceMinor),
    taxIncluded: row.taxIncluded,
    taxRatePercent: parseNumeric(row.taxRate),
    yieldRatePercent: parseNumeric(row.yieldRate),
    supplierId: row.supplierId ?? undefined,
    version: row.version,
  });
}

export function toIngredientInsertRow(ingredient: Ingredient): NewIngredientRow {
  return {
    teamId: ingredient.teamId,
    name: ingredient.name,
    purchaseUnit: ingredient.purchaseQuantity.unit.code,
    purchaseQty: formatNumeric(ingredient.purchaseQuantity.value, 3),
    purchasePriceMinor: ingredient.purchasePrice.amountMinor,
    taxIncluded: ingredient.taxIncluded,
    taxRate: formatNumeric(ingredient.taxRatePercent, 2),
    stockUnit: ingredient.stockUnit.code,
    convPurchaseToStock: formatNumeric(ingredient.conversion.factor, 6),
    yieldRate: formatNumeric(ingredient.yieldRatePercent, 2),
    supplierId: ingredient.supplierId ?? null,
    version: ingredient.version,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function toIngredientUpdateRow(ingredient: Ingredient) {
  return {
    name: ingredient.name,
    purchaseUnit: ingredient.purchaseQuantity.unit.code,
    purchaseQty: formatNumeric(ingredient.purchaseQuantity.value, 3),
    purchasePriceMinor: ingredient.purchasePrice.amountMinor,
    taxIncluded: ingredient.taxIncluded,
    taxRate: formatNumeric(ingredient.taxRatePercent, 2),
    stockUnit: ingredient.stockUnit.code,
    convPurchaseToStock: formatNumeric(ingredient.conversion.factor, 6),
    yieldRate: formatNumeric(ingredient.yieldRatePercent, 2),
    supplierId: ingredient.supplierId ?? null,
    version: ingredient.version + 1,
    updatedAt: new Date(),
  };
}
