import { z } from 'zod';

import { Money } from '@/domain/shared/money';
import {
  createConversion,
  createQuantity,
  getUnit,
} from '@/domain/shared/unit';
import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';
import {
  moneyMinorSchema,
  percentageSchema,
  positiveNumberSchema,
  unitCodeSchema,
} from '@/lib/zod-schemas';
import { createIngredient } from '@/domain/catalog/ingredient';
import { ingredientToResponse } from './presenter';

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  version: z.coerce.number().int().positive(),
  name: z.string().min(1).max(140),
  purchaseUnit: unitCodeSchema,
  purchaseQty: z.coerce.number().pipe(positiveNumberSchema),
  purchasePriceMinor: z.coerce.number().pipe(moneyMinorSchema),
  taxIncluded: z.coerce.boolean(),
  taxRatePercent: z.coerce.number().pipe(percentageSchema),
  stockUnit: unitCodeSchema,
  convPurchaseToStock: z.coerce.number().pipe(positiveNumberSchema),
  yieldRatePercent: z.coerce.number().pipe(
    percentageSchema.refine((value) => value > 0, '歩留まりは0より大きい必要があります'),
  ),
  supplierId: z.coerce.number().int().positive().optional(),
});

export type UpdateIngredientInput = z.infer<typeof updateSchema>;

const repository = new IngredientRepository();

export async function updateIngredientPricing(input: UpdateIngredientInput) {
  const data = updateSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const existing = await repository.findById(teamId, data.id);
  if (!existing) {
    throw new Error('材料が見つかりません');
  }

  if (existing.version !== data.version) {
    throw new Error('最新の材料データではありません。画面を更新してください。');
  }

  const purchaseUnit = getUnit(data.purchaseUnit);
  const stockUnit = getUnit(data.stockUnit);

  const updated = createIngredient({
    ...existing,
    name: data.name,
    purchaseQuantity: createQuantity(data.purchaseQty, purchaseUnit),
    stockUnit,
    conversion: createConversion(purchaseUnit, stockUnit, data.convPurchaseToStock),
    purchasePrice: Money.ofMinor(data.purchasePriceMinor),
    taxIncluded: data.taxIncluded,
    taxRatePercent: data.taxRatePercent,
    yieldRatePercent: data.yieldRatePercent,
    supplierId: data.supplierId,
    version: existing.version,
  });

  const saved = await repository.update(updated);
  return ingredientToResponse(saved);
}
