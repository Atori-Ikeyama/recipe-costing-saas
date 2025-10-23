import { Supplier } from '@/domain/catalog/supplier';

export interface SupplierResponse {
  id: number;
  name: string;
  leadTimeDays: number;
}

export function supplierToResponse(supplier: Supplier): SupplierResponse {
  return {
    id: supplier.id,
    name: supplier.name,
    leadTimeDays: supplier.leadTimeDays,
  };
}
