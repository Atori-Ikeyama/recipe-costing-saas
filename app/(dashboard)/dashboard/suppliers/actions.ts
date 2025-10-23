'use server';

import { revalidatePath } from 'next/cache';

import {
  registerSupplier,
  updateSupplier,
  deleteSupplier,
} from '@/application/suppliers';
import type { RegisterSupplierInput } from '@/application/suppliers/register';
import type { UpdateSupplierInput } from '@/application/suppliers/update';
import type { DeleteSupplierInput } from '@/application/suppliers/delete';

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

export async function createSupplierAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const payload: RegisterSupplierInput = {
      name: String(formData.get('name') ?? ''),
      leadTimeDays: toNumber(formData.get('leadTimeDays')),
    };

    await registerSupplier(payload);
    revalidatePath('/dashboard/suppliers');
    return { success: '仕入先を追加しました' };
  } catch (error) {
    console.error('createSupplierAction failed', error);
    return {
      error:
        error instanceof Error ? error.message : '仕入先の登録に失敗しました',
    };
  }
}

export async function updateSupplierAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const payload: UpdateSupplierInput = {
      id: toNumber(formData.get('id')),
      name: String(formData.get('name') ?? ''),
      leadTimeDays: toNumber(formData.get('leadTimeDays')),
    };

    await updateSupplier(payload);
    revalidatePath('/dashboard/suppliers');
    return { success: '仕入先を更新しました' };
  } catch (error) {
    console.error('updateSupplierAction failed', error);
    return {
      error:
        error instanceof Error ? error.message : '仕入先の更新に失敗しました',
    };
  }
}

export async function deleteSupplierAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const payload: DeleteSupplierInput = {
      id: toNumber(formData.get('id')),
    };

    await deleteSupplier(payload);
    revalidatePath('/dashboard/suppliers');
    return { success: '仕入先を削除しました' };
  } catch (error) {
    console.error('deleteSupplierAction failed', error);
    const dbCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: string }).code
        : undefined;
    return {
      error:
        dbCode === '23503'
          ? '材料で使用中の仕入先は削除できません。先に材料の仕入先を変更してください。'
          : error instanceof Error
            ? error.message
            : '仕入先の削除に失敗しました',
    };
  }
}
