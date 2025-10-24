'use server';

import { calculateProcurement } from '@/application/procurement/calculate';
import type { CalculateProcurementInput } from '@/application/procurement/calculate';

function toNumber(value: FormDataEntryValue | null): number {
  if (value === null || value === undefined || value === '') {
    return NaN;
  }
  return Number(value);
}

export async function calculateHomeMetricsAction(formData: FormData) {
  const itemCount = Number(formData.get('itemCount') ?? 0);
  const planItems: CalculateProcurementInput['planItems'] = [];

  for (let index = 0; index < itemCount; index += 1) {
    planItems.push({
      recipeId: toNumber(formData.get(`items.${index}.recipeId`)),
      servings: toNumber(formData.get(`items.${index}.servings`)),
    });
  }

  return calculateProcurement({
    planItems,
  });
}
