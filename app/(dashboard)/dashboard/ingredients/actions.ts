'use server';

import { revalidatePath } from 'next/cache';

import {
  registerIngredient,
  updateIngredientPricing,
} from '@/application/ingredients';
import type {
  RegisterIngredientInput,
  UpdateIngredientInput,
} from '@/application/ingredients/register';

type ActionState = {
  error?: string;
  success?: string;
};

function normalizeBoolean(value: FormDataEntryValue | null): boolean {
  if (typeof value === 'string') {
    return value === 'true' || value === 'on';
  }
  return Boolean(value);
}

function toNumber(value: FormDataEntryValue | null): number {
  if (value === null || value === undefined || value === '') {
    return NaN;
  }
  return Number(value);
}

function toOptionalNumber(
  value: FormDataEntryValue | null,
): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  return Number(value);
}

export async function createIngredientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const payload: RegisterIngredientInput = {
      name: String(formData.get('name') ?? ''),
      purchaseUnit: String(formData.get('purchaseUnit') ?? ''),
      purchaseQty: toNumber(formData.get('purchaseQty')),
      purchasePriceMinor: toNumber(formData.get('purchasePriceMinor')),
      taxIncluded: normalizeBoolean(formData.get('taxIncluded')),
      taxRatePercent: toNumber(formData.get('taxRatePercent')),
      stockUnit: String(formData.get('stockUnit') ?? ''),
      convPurchaseToStock: toNumber(formData.get('convPurchaseToStock')),
      yieldRatePercent: toNumber(formData.get('yieldRatePercent')),
      supplierId: toOptionalNumber(formData.get('supplierId')),
    };

    await registerIngredient(payload);
    revalidatePath('/dashboard/ingredients');

    return { success: '材料を追加しました' };
  } catch (error) {
    console.error('createIngredientAction failed', error);
    return {
      error: error instanceof Error ? error.message : '材料の登録に失敗しました',
    };
  }
}

export async function updateIngredientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const payload: UpdateIngredientInput = {
      id: toNumber(formData.get('id')),
      version: toNumber(formData.get('version')),
      name: String(formData.get('name') ?? ''),
      purchaseUnit: String(formData.get('purchaseUnit') ?? ''),
      purchaseQty: toNumber(formData.get('purchaseQty')),
      purchasePriceMinor: toNumber(formData.get('purchasePriceMinor')),
      taxIncluded: normalizeBoolean(formData.get('taxIncluded')),
      taxRatePercent: toNumber(formData.get('taxRatePercent')),
      stockUnit: String(formData.get('stockUnit') ?? ''),
      convPurchaseToStock: toNumber(formData.get('convPurchaseToStock')),
      yieldRatePercent: toNumber(formData.get('yieldRatePercent')),
      supplierId: toOptionalNumber(formData.get('supplierId')),
    };

    await updateIngredientPricing(payload);
    revalidatePath('/dashboard/ingredients');

    return { success: '材料を更新しました' };
  } catch (error) {
    console.error('updateIngredientAction failed', error);
    return {
      error: error instanceof Error ? error.message : '材料の更新に失敗しました',
    };
  }
}
