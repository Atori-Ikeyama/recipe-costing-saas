import {
  pgTable,
  serial,
  integer,
  varchar,
  date,
  timestamp,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

import { teams } from '../base-schema';
import { recipes } from './recipes';

export const salesPlans = pgTable('sales_plans', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 160 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const salesPlanItems = pgTable(
  'sales_plan_items',
  {
    id: serial('id').primaryKey(),
    salesPlanId: integer('sales_plan_id')
      .notNull()
      .references(() => salesPlans.id, { onDelete: 'cascade' }),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id),
    servings: integer('servings').notNull(),
  },
  (table) => ({
    servingsPositive: check(
      'sales_plan_items_servings_positive',
      sql`${table.servings} > 0`,
    ),
  }),
);

export const salesPlansRelations = relations(salesPlans, ({ many, one }) => ({
  items: many(salesPlanItems),
  team: one(teams, {
    fields: [salesPlans.teamId],
    references: [teams.id],
  }),
}));

export const salesPlanItemsRelations = relations(salesPlanItems, ({ one }) => ({
  plan: one(salesPlans, {
    fields: [salesPlanItems.salesPlanId],
    references: [salesPlans.id],
  }),
  recipe: one(recipes, {
    fields: [salesPlanItems.recipeId],
    references: [recipes.id],
  }),
}));

export type SalesPlanRow = typeof salesPlans.$inferSelect;
export type NewSalesPlanRow = typeof salesPlans.$inferInsert;
export type SalesPlanItemRow = typeof salesPlanItems.$inferSelect;
