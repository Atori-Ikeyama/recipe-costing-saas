import {
  NewSupplierRow,
  SupplierRow,
} from '@/lib/db/schema/suppliers';
import { createSupplier, Supplier } from '@/domain/catalog/supplier';

export function toSupplierDomain(row: SupplierRow): Supplier {
  return createSupplier({
    id: row.id,
    teamId: row.teamId,
    name: row.name,
    leadTimeDays: row.leadTimeDays,
  });
}

export function toSupplierInsertRow(supplier: Supplier): NewSupplierRow {
  return {
    teamId: supplier.teamId,
    name: supplier.name,
    leadTimeDays: supplier.leadTimeDays,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function toSupplierUpdateRow(supplier: Supplier) {
  return {
    name: supplier.name,
    leadTimeDays: supplier.leadTimeDays,
    updatedAt: new Date(),
  };
}
