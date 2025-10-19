import { z } from 'zod';

import { SalesPlanRepository } from '@/infrastructure/repositories/sales-plan.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { nonNegativeNumberSchema } from '@/lib/zod-schemas';

const planItemSchema = z.object({
  recipeId: z.coerce.number().int().positive(),
  servings: z.coerce.number().pipe(nonNegativeNumberSchema),
});

const savePlanSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().min(1).max(160),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  items: z.array(planItemSchema),
});

export type SaveSalesPlanInput = z.infer<typeof savePlanSchema>;

const repository = new SalesPlanRepository();

export async function saveSalesPlan(input: SaveSalesPlanInput) {
  const data = savePlanSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const plan = await repository.savePlan({
    id: data.id,
    teamId,
    name: data.name,
    startDate: data.startDate,
    endDate: data.endDate,
    items: data.items.map((item) => ({
      recipeId: item.recipeId,
      servings: Math.round(item.servings),
    })),
  });

  return plan;
}

export async function listSalesPlans() {
  const { teamId } = await requireTeamContext();
  return repository.listByTeam(teamId);
}
