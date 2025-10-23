import { and, asc, eq, ilike } from 'drizzle-orm';

import { suppliers } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import {
  toSupplierDomain,
  toSupplierInsertRow,
  toSupplierUpdateRow,
} from '@/infrastructure/mappers/supplier.mapper';
import { Supplier } from '@/domain/catalog/supplier';
import { ValidationError } from '@/domain/shared/errors';

const escapeLikePattern = (value: string) => value.replace(/[%_]/g, '\\$&');

type ListOptions = {
  search?: string;
};

export class SupplierRepository {
  async listByTeam(
    teamId: number,
    options: ListOptions = {},
  ): Promise<Supplier[]> {
    const where = options.search
      ? and(
          eq(suppliers.teamId, teamId),
          ilike(suppliers.name, `%${escapeLikePattern(options.search)}%`),
        )
      : eq(suppliers.teamId, teamId);

    const rows = await db.query.suppliers.findMany({
      where,
      orderBy: asc(suppliers.name),
    });

    return rows.map(toSupplierDomain);
  }

  async findById(teamId: number, id: number): Promise<Supplier | null> {
    const row = await db.query.suppliers.findFirst({
      where: and(eq(suppliers.teamId, teamId), eq(suppliers.id, id)),
    });
    return row ? toSupplierDomain(row) : null;
  }

  async create(supplier: Supplier): Promise<Supplier> {
    const [row] = await db
      .insert(suppliers)
      .values(toSupplierInsertRow(supplier))
      .returning();

    if (!row) {
      throw new ValidationError('Failed to persist supplier');
    }

    return toSupplierDomain(row);
  }

  async update(supplier: Supplier): Promise<Supplier> {
    const [row] = await db
      .update(suppliers)
      .set(toSupplierUpdateRow(supplier))
      .where(
        and(
          eq(suppliers.id, supplier.id),
          eq(suppliers.teamId, supplier.teamId),
        ),
      )
      .returning();

    if (!row) {
      throw new ValidationError('Supplier update failed');
    }

    return toSupplierDomain(row);
  }

  async delete(teamId: number, id: number): Promise<void> {
    const [row] = await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.teamId, teamId)))
      .returning({ id: suppliers.id });

    if (!row) {
      throw new ValidationError('Supplier deletion failed');
    }
  }
}
