import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  integer,
  varchar,
  numeric,
  timestamp,
  boolean,
  check,
} from 'drizzle-orm/pg-core';

import { teams } from '../base-schema';
import { ingredients } from './ingredients';

export const recipes = pgTable(
  'recipes',
  {
    id: serial('id').primaryKey(),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    name: varchar('name', { length: 160 }).notNull(),
    batchOutputQty: numeric('batch_output_qty', {
      precision: 12,
      scale: 3,
    }).notNull(),
    batchOutputUnit: varchar('batch_output_unit', { length: 24 }).notNull(),
    servingSizeQty: numeric('serving_size_qty', {
      precision: 12,
      scale: 3,
    }).notNull(),
    servingSizeUnit: varchar('serving_size_unit', { length: 24 }).notNull(),
    platingYieldRate: numeric('plating_yield_rate', {
      precision: 5,
      scale: 2,
    }),
    sellingPriceMinor: integer('selling_price_minor'),
    sellingPriceTaxIncluded: boolean('selling_price_tax_included'),
    sellingTaxRate: numeric('selling_tax_rate', { precision: 5, scale: 2 }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    batchOutputPositive: check(
      'recipes_batch_output_qty_positive',
      sql`${table.batchOutputQty} > 0`,
    ),
    servingQtyPositive: check(
      'recipes_serving_size_qty_positive',
      sql`${table.servingSizeQty} > 0`,
    ),
  }),
);

export const recipeItems = pgTable(
  'recipe_items',
  {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    ingredientId: integer('ingredient_id')
      .notNull()
      .references(() => ingredients.id),
    qty: numeric('qty', { precision: 12, scale: 3 }).notNull(),
    unit: varchar('unit', { length: 24 }).notNull(),
    wasteRate: numeric('waste_rate', { precision: 6, scale: 4 }).notNull(),
  },
  (table) => ({
    qtyPositive: check(
      'recipe_items_qty_positive',
      sql`${table.qty} > 0`,
    ),
    wasteRateRange: check(
      'recipe_items_waste_rate_range',
      sql`${table.wasteRate} >= 0 AND ${table.wasteRate} < 1`,
    ),
  }),
);

export const recipesRelations = relations(recipes, ({ many, one }) => ({
  items: many(recipeItems),
  team: one(teams, {
    fields: [recipes.teamId],
    references: [teams.id],
  }),
}));

export const recipeItemsRelations = relations(recipeItems, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeItems.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeItems.ingredientId],
    references: [ingredients.id],
  }),
}));

export type RecipeRow = typeof recipes.$inferSelect;
export type NewRecipeRow = typeof recipes.$inferInsert;
export type RecipeItemRow = typeof recipeItems.$inferSelect;
export type NewRecipeItemRow = typeof recipeItems.$inferInsert;
