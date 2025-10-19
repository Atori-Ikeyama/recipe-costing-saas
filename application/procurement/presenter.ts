import { calculateProcurement } from '@/domain/procurement/procurement-calculator';

export interface ProcurementItemResponse {
  ingredientId: number;
  stockUnit: string;
  totalStockQty: number;
  purchaseUnit: string;
  purchaseQty: number;
  requiredPurchaseUnits: number;
  estimatedAmountMinor: number;
}

export interface ProcurementResponse {
  items: ProcurementItemResponse[];
  totalCostMinor: number;
}

export function toProcurementResponse(result: ReturnType<typeof calculateProcurement>): ProcurementResponse {
  return {
    items: result.items.map((item) => ({
      ingredientId: item.ingredientId,
      stockUnit: item.stockQuantity.unit.code,
      totalStockQty: item.stockQuantity.value,
      purchaseUnit: item.purchaseQuantity.unit.code,
      purchaseQty: item.purchaseQuantity.value,
      requiredPurchaseUnits: item.requiredPurchaseUnits,
      estimatedAmountMinor: item.estimatedAmountMinor,
    })),
    totalCostMinor: result.totalCostMinor,
  };
}
