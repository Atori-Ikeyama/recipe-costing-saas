import { z } from 'zod';

import { Money } from '@/domain/shared/money';
import {
  createConversion,
  createQuantity,
  getUnit,
} from '@/domain/shared/unit';
import { createIngredient } from '@/domain/catalog/ingredient';
import { IngredientRepository } from '@/infrastructure/repositories/ingredient.repo';
import { requireTeamContext } from '@/lib/auth/team';
import {
  moneyMinorSchema,
  percentageSchema,
  positiveNumberSchema,
  unitCodeSchema,
} from '@/lib/zod-schemas';
import { ingredientToResponse } from './presenter';

const registerSchema = z.object({
  name: z.string().min(1, '名称は必須です').max(140),
  purchaseUnit: unitCodeSchema,
  purchaseQty: z.coerce.number().pipe(positiveNumberSchema),
  purchasePriceMinor: z.coerce.number().pipe(moneyMinorSchema),
  stockUnit: unitCodeSchema,
  convPurchaseToStock: z.coerce.number().pipe(positiveNumberSchema),
  yieldRatePercent: z.coerce.number().pipe(
    percentageSchema.refine((value) => value > 0, '歩留まりは0より大きい必要があります'),
  ),
  supplierId: z.coerce.number().int().positive().optional(),
});

export type RegisterIngredientInput = z.infer<typeof registerSchema>;

const repository = new IngredientRepository();

export async function registerIngredient(input: RegisterIngredientInput) {
  const data = registerSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const purchaseUnit = getUnit(data.purchaseUnit);
  const stockUnit = getUnit(data.stockUnit);

  const domain = createIngredient({
    id: 0,
    teamId,
    name: data.name,
    purchaseQuantity: createQuantity(data.purchaseQty, purchaseUnit),
    stockUnit,
    conversion: createConversion(purchaseUnit, stockUnit, data.convPurchaseToStock),
    purchasePrice: Money.ofMinor(data.purchasePriceMinor),
    yieldRatePercent: data.yieldRatePercent,
    supplierId: data.supplierId,
    version: 1,
  });

  const saved = await repository.create(domain);
  return ingredientToResponse(saved);
}
