import { pgTable, serial, varchar, integer, numeric, timestamp, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

import { teams } from '../base-schema';
import { suppliers } from './suppliers';

export const ingredients = pgTable(
  'ingredients',
  {
    id: serial('id').primaryKey(),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    name: varchar('name', { length: 140 }).notNull(),
    purchaseUnit: varchar('purchase_unit', { length: 24 }).notNull(),
    purchaseQty: numeric('purchase_qty', { precision: 12, scale: 3 }).notNull(),
    purchasePriceMinor: integer('purchase_price_minor').notNull(),
    stockUnit: varchar('stock_unit', { length: 24 }).notNull(),
    convPurchaseToStock: numeric('conv_p_to_s', {
      precision: 12,
      scale: 6,
    }).notNull(),
    yieldRate: numeric('yield_rate', { precision: 5, scale: 2 }).notNull(),
    supplierId: integer('supplier_id').references(() => suppliers.id),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    purchaseQtyPositive: check(
      'ingredients_purchase_qty_positive',
      sql`${table.purchaseQty} > 0`,
    ),
    convPositive: check(
      'ingredients_conv_positive',
      sql`${table.convPurchaseToStock} > 0`,
    ),
    yieldRateRange: check(
      'ingredients_yield_rate_range',
      sql`${table.yieldRate} > 0 AND ${table.yieldRate} <= 100`,
    ),
  }),
);

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [ingredients.supplierId],
    references: [suppliers.id],
  }),
  team: one(teams, {
    fields: [ingredients.teamId],
    references: [teams.id],
  }),
}));

export type IngredientRow = typeof ingredients.$inferSelect;
export type NewIngredientRow = typeof ingredients.$inferInsert;
