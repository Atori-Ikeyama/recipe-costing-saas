import { z } from 'zod';

import {
  moneyMinorSchema,
  percentageSchema,
  positiveNumberSchema,
  unitCodeSchema,
} from '@/lib/zod-schemas';

export const recipeItemInputSchema = z.object({
  ingredientId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().pipe(positiveNumberSchema),
  unit: unitCodeSchema,
  wasteRate: z.coerce.number().min(0).max(0.99),
});

export const recipePayloadSchema = z.object({
  name: z.string().min(1).max(160),
  batchOutputQty: z.coerce.number().pipe(positiveNumberSchema),
  batchOutputUnit: unitCodeSchema,
  servingSizeQty: z.coerce.number().pipe(positiveNumberSchema),
  servingSizeUnit: unitCodeSchema,
  platingYieldRatePercent: z
    .coerce.number()
    .optional()
    .refine(
      (val) => val === undefined || (val > 0 && val <= 100),
      '盛付歩留まりは0より大きく100以下で指定してください',
    ),
  sellingPriceMinor: z.coerce.number().pipe(moneyMinorSchema).optional(),
  sellingPriceTaxIncluded: z.coerce.boolean().optional(),
  sellingTaxRatePercent: z.coerce.number().pipe(percentageSchema).optional(),
  items: z
    .array(recipeItemInputSchema)
    .min(1, 'レシピには1件以上の材料が必要です'),
});

export type RecipePayloadInput = z.infer<typeof recipePayloadSchema>;
