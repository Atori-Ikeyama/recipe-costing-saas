import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { salesPlanItems, salesPlans } from '@/lib/db/schema';
import { ValidationError } from '@/domain/shared/errors';
import { SalesPlanItemRow, SalesPlanRow } from '@/lib/db/schema/sales-plans';

export interface SalesPlanEntity {
  id: number;
  teamId: number;
  name: string;
  startDate: string;
  endDate: string;
  items: Array<{
    id: number;
    recipeId: number;
    servings: number;
  }>;
}

export interface SalesPlanDraft {
  id?: number;
  teamId: number;
  name: string;
  startDate: string;
  endDate: string;
  items: Array<{
    recipeId: number;
    servings: number;
  }>;
}

export class SalesPlanRepository {
  async listByTeam(teamId: number): Promise<SalesPlanEntity[]> {
    const plans = await db.query.salesPlans.findMany({
      where: eq(salesPlans.teamId, teamId),
      orderBy: asc(salesPlans.startDate),
      with: {
        items: true,
      },
    });

    return plans.map(mapPlan);
  }

  async findById(teamId: number, id: number): Promise<SalesPlanEntity | null> {
    const plan = await db.query.salesPlans.findFirst({
      where: and(eq(salesPlans.teamId, teamId), eq(salesPlans.id, id)),
      with: {
        items: true,
      },
    });

    return plan ? mapPlan(plan) : null;
  }

  async savePlan(draft: SalesPlanDraft): Promise<SalesPlanEntity> {
    return await db.transaction(async (tx) => {
      let planRow: SalesPlanRow;

      if (draft.id) {
        const [updated] = await tx
          .update(salesPlans)
          .set({
            name: draft.name,
            startDate: draft.startDate,
            endDate: draft.endDate,
          })
          .where(
            and(
              eq(salesPlans.id, draft.id),
              eq(salesPlans.teamId, draft.teamId),
            ),
          )
          .returning();

        if (!updated) {
          throw new ValidationError('Sales plan not found');
        }

        planRow = updated;
        await tx
          .delete(salesPlanItems)
          .where(eq(salesPlanItems.salesPlanId, updated.id));
      } else {
        const [created] = await tx
          .insert(salesPlans)
          .values({
            teamId: draft.teamId,
            name: draft.name,
            startDate: draft.startDate,
            endDate: draft.endDate,
          })
          .returning();

        if (!created) {
          throw new ValidationError('Failed to create sales plan');
        }

        planRow = created;
      }

      if (draft.items.length > 0) {
        await tx.insert(salesPlanItems).values(
          draft.items.map((item) => ({
            salesPlanId: planRow.id,
            recipeId: item.recipeId,
            servings: item.servings,
          })),
        );
      }

      const items = await tx.query.salesPlanItems.findMany({
        where: eq(salesPlanItems.salesPlanId, planRow.id),
      });

      return mapPlan({
        ...planRow,
        items,
      });
    });
  }
}

function mapPlan(row: SalesPlanRow & { items: SalesPlanItemRow[] }): SalesPlanEntity {
  return {
    id: row.id,
    teamId: row.teamId,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    items: row.items.map((item) => ({
      id: item.id,
      recipeId: item.recipeId,
      servings: item.servings,
    })),
  };
}
