'use server';

import { revalidatePath } from 'next/cache';

import {
  registerIngredient,
  updateIngredientPricing,
  deleteIngredient,
} from '@/application/ingredients';
import type {
  RegisterIngredientInput,
  UpdateIngredientInput,
} from '@/application/ingredients/register';
import type { DeleteIngredientInput } from '@/application/ingredients/delete';

type ActionState = {
  error?: string;
  success?: string;
};

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
    const stockUnitInput = formData.get('stockUnit') ?? 'g';
    const payload: RegisterIngredientInput = {
      name: String(formData.get('name') ?? ''),
      purchaseUnit: String(formData.get('purchaseUnit') ?? ''),
      purchaseQty: toNumber(formData.get('purchaseQty')),
      purchasePriceMinor: toNumber(formData.get('purchasePriceMinor')),
      stockUnit: String(stockUnitInput || 'g'),
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
    const stockUnitInput = formData.get('stockUnit') ?? 'g';
    const payload: UpdateIngredientInput = {
      id: toNumber(formData.get('id')),
      version: toNumber(formData.get('version')),
      name: String(formData.get('name') ?? ''),
      purchaseUnit: String(formData.get('purchaseUnit') ?? ''),
      purchaseQty: toNumber(formData.get('purchaseQty')),
      purchasePriceMinor: toNumber(formData.get('purchasePriceMinor')),
      stockUnit: String(stockUnitInput || 'g'),
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

export async function deleteIngredientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const payload: DeleteIngredientInput = {
      id: toNumber(formData.get('id')),
      version: toNumber(formData.get('version')),
    };

    await deleteIngredient(payload);
    revalidatePath('/dashboard/ingredients');
    return { success: '材料を削除しました' };
  } catch (error) {
    console.error('deleteIngredientAction failed', error);
    const dbCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: string }).code
        : undefined;
    return {
      error:
        dbCode === '23503'
          ? 'レシピで使用されている材料は削除できません。先にレシピから除外してください。'
          : error instanceof Error
            ? error.message
            : '材料の削除に失敗しました',
    };
  }
}
