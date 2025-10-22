import { and, asc, eq, ilike } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { ingredients } from '@/lib/db/schema';
import {
  toIngredientDomain,
  toIngredientInsertRow,
  toIngredientUpdateRow,
} from '@/infrastructure/mappers/ingredient.mapper';
import { Ingredient } from '@/domain/catalog/ingredient';
import { ValidationError } from '@/domain/shared/errors';

const escapeLikePattern = (value: string) => value.replace(/[%_]/g, '\\$&');

type ListOptions = {
  search?: string;
};

export class IngredientRepository {
  async listByTeam(
    teamId: number,
    options: ListOptions = {},
  ): Promise<Ingredient[]> {
    const where = options.search
      ? and(
          eq(ingredients.teamId, teamId),
          ilike(
            ingredients.name,
            `%${escapeLikePattern(options.search)}%`,
          ),
        )
      : eq(ingredients.teamId, teamId);

    const rows = await db.query.ingredients.findMany({
      where,
      orderBy: asc(ingredients.name),
    });

    return rows.map(toIngredientDomain);
  }

  async findById(teamId: number, id: number): Promise<Ingredient | null> {
    const row = await db.query.ingredients.findFirst({
      where: and(eq(ingredients.teamId, teamId), eq(ingredients.id, id)),
    });

    return row ? toIngredientDomain(row) : null;
  }

  async create(ingredient: Ingredient): Promise<Ingredient> {
    const [row] = await db
      .insert(ingredients)
      .values(toIngredientInsertRow(ingredient))
      .returning();

    if (!row) {
      throw new ValidationError('Failed to persist ingredient');
    }

    return toIngredientDomain(row);
  }

  async update(ingredient: Ingredient): Promise<Ingredient> {
    const [row] = await db
      .update(ingredients)
      .set(toIngredientUpdateRow(ingredient))
      .where(
        and(
          eq(ingredients.id, ingredient.id),
          eq(ingredients.teamId, ingredient.teamId),
          eq(ingredients.version, ingredient.version),
        ),
      )
      .returning();

    if (!row) {
      throw new ValidationError(
        'Ingredient update failed due to concurrent modification',
      );
    }

    return toIngredientDomain(row);
  }

  async delete(teamId: number, id: number, version: number): Promise<void> {
    const [row] = await db
      .delete(ingredients)
      .where(
        and(
          eq(ingredients.id, id),
          eq(ingredients.teamId, teamId),
          eq(ingredients.version, version),
        ),
      )
      .returning({ id: ingredients.id });

    if (!row) {
      throw new ValidationError(
        'Ingredient deletion failed due to concurrent modification',
      );
    }
  }
}
