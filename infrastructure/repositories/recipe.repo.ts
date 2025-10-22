import { and, asc, eq, ilike } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { recipeItems, recipes } from '@/lib/db/schema';
import {
  RecipeComposite,
  toRecipeDomain,
  toRecipeInsertRow,
  toRecipeItemInsertRow,
  toRecipeUpdateRow,
} from '@/infrastructure/mappers/recipe.mapper';
import { ValidationError } from '@/domain/shared/errors';
import { Recipe as RecipeAggregate } from '@/domain/recipe/recipe';

const escapeLikePattern = (value: string) => value.replace(/[%_]/g, '\\$&');

type ListOptions = {
  search?: string;
};

export class RecipeRepository {
  async listByTeam(
    teamId: number,
    options: ListOptions = {},
  ): Promise<RecipeAggregate[]> {
    const where = options.search
      ? and(
          eq(recipes.teamId, teamId),
          ilike(recipes.name, `%${escapeLikePattern(options.search)}%`),
        )
      : eq(recipes.teamId, teamId);

    const rows = await db.query.recipes.findMany({
      where,
      with: {
        items: true,
      },
      orderBy: asc(recipes.name),
    });

    return rows.map((row) =>
      toRecipeDomain({ recipe: row, items: row.items }),
    );
  }

  async findById(teamId: number, id: number): Promise<RecipeAggregate | null> {
    const row = await db.query.recipes.findFirst({
      where: and(eq(recipes.teamId, teamId), eq(recipes.id, id)),
      with: {
        items: true,
      },
    });

    return row
      ? toRecipeDomain({ recipe: row, items: row.items })
      : null;
  }

  async create(recipe: RecipeAggregate): Promise<RecipeAggregate> {
    return await db.transaction(async (tx) => {
      const [recipeRow] = await tx
        .insert(recipes)
        .values(toRecipeInsertRow(recipe))
        .returning();

      if (!recipeRow) {
        throw new ValidationError('Failed to create recipe');
      }

      const recipeId = recipeRow.id;
      if (recipe.items.length > 0) {
        await tx.insert(recipeItems).values(
          recipe.items.map((item) =>
            toRecipeItemInsertRow(recipeId, item),
          ),
        );
      }

      const composite: RecipeComposite = {
        recipe: recipeRow,
        items:
          recipe.items.length > 0
            ? await tx.query.recipeItems.findMany({
                where: eq(recipeItems.recipeId, recipeId),
              })
            : [],
      };

      return toRecipeDomain(composite);
    });
  }

  async save(recipe: RecipeAggregate): Promise<RecipeAggregate> {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(recipes)
        .set(toRecipeUpdateRow(recipe))
        .where(
          and(
            eq(recipes.id, recipe.id),
            eq(recipes.teamId, recipe.teamId),
            eq(recipes.version, recipe.version),
          ),
        )
        .returning();

      if (!updated) {
        throw new ValidationError('Recipe update conflict detected');
      }

      await tx.delete(recipeItems).where(eq(recipeItems.recipeId, recipe.id));
      if (recipe.items.length > 0) {
        await tx.insert(recipeItems).values(
          recipe.items.map((item) =>
            toRecipeItemInsertRow(recipe.id, item),
          ),
        );
      }

      const items = await tx.query.recipeItems.findMany({
        where: eq(recipeItems.recipeId, recipe.id),
      });

      return toRecipeDomain({ recipe: updated, items });
    });
  }

  async appendItem(
    teamId: number,
    recipeId: number,
    item: RecipeAggregate['items'][number],
  ): Promise<void> {
    const exists = await db.query.recipes.findFirst({
      where: and(eq(recipes.teamId, teamId), eq(recipes.id, recipeId)),
      columns: {
        id: true,
      },
    });

    if (!exists) {
      throw new ValidationError('Recipe not found for team');
    }

    await db.insert(recipeItems).values(
      toRecipeItemInsertRow(recipeId, item),
    );
  }

  async delete(teamId: number, id: number, version: number): Promise<void> {
    const [row] = await db
      .delete(recipes)
      .where(
        and(
          eq(recipes.id, id),
          eq(recipes.teamId, teamId),
          eq(recipes.version, version),
        ),
      )
      .returning({ id: recipes.id });

    if (!row) {
      throw new ValidationError(
        'Recipe deletion failed due to concurrent modification',
      );
    }
  }
}
