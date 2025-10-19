import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { ingredients } from '@/lib/db/schema';
import {
  toIngredientDomain,
  toIngredientInsertRow,
  toIngredientUpdateRow,
} from '@/infrastructure/mappers/ingredient.mapper';
import { Ingredient } from '@/domain/catalog/ingredient';
import { ValidationError } from '@/domain/shared/errors';

export class IngredientRepository {
  async listByTeam(teamId: number): Promise<Ingredient[]> {
    const rows = await db.query.ingredients.findMany({
      where: eq(ingredients.teamId, teamId),
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
}
