'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  addRecipeItem,
  createRecipeEntry,
  deleteRecipe,
  previewRecipeCost,
  updateRecipeEntry,
} from '@/application/recipes';
import type { CreateRecipeInput } from '@/application/recipes/create';
import type { AddRecipeItemInput } from '@/application/recipes/add-item';
import type { PreviewRecipeInput } from '@/application/recipes/preview-cost';
import type { DeleteRecipeInput } from '@/application/recipes/delete';
import type { UpdateRecipeInput } from '@/application/recipes/update';

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

function getBoolean(value: FormDataEntryValue | null): boolean | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    return value === 'true' || value === 'on';
  }
  return Boolean(value);
}

type RecipeFormItem = {
  ingredientId: number;
  quantity: number;
  unit: string;
  wasteRate: number;
};

function collectItems(formData: FormData): RecipeFormItem[] {
  const itemCount = Number(formData.get('itemCount') ?? 0);
  const items: RecipeFormItem[] = [];

  for (let index = 0; index < itemCount; index += 1) {
    items.push({
      ingredientId: toNumber(formData.get(`items.${index}.ingredientId`)),
      quantity: toNumber(formData.get(`items.${index}.quantity`)),
      unit: String(formData.get(`items.${index}.unit`) ?? ''),
      wasteRate: Number(formData.get(`items.${index}.wasteRate`) ?? 0),
    });
  }

  return items;
}

export async function createRecipeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const items = collectItems(formData) as CreateRecipeInput['items'];

    const payload: CreateRecipeInput = {
      name: String(formData.get('name') ?? ''),
      batchOutputQty: toNumber(formData.get('batchOutputQty')),
      batchOutputUnit: String(formData.get('batchOutputUnit') ?? ''),
      servingSizeQty: toNumber(formData.get('servingSizeQty')),
      servingSizeUnit: String(formData.get('servingSizeUnit') ?? ''),
      platingYieldRatePercent: toOptionalNumber(
        formData.get('platingYieldRatePercent'),
      ),
      sellingPriceMinor: toOptionalNumber(formData.get('sellingPriceMinor')),
      sellingPriceTaxIncluded: getBoolean(
        formData.get('sellingPriceTaxIncluded'),
      ),
      sellingTaxRatePercent: toOptionalNumber(
        formData.get('sellingTaxRatePercent'),
      ),
      items,
    };

    const recipe = await createRecipeEntry(payload);
    revalidatePath('/dashboard/recipes');
    redirect('/dashboard/recipes');
  } catch (error) {
    console.error('createRecipeAction failed', error);
    return {
      error: error instanceof Error ? error.message : 'レシピの作成に失敗しました',
    };
  }
}

export async function addRecipeItemAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const payload: AddRecipeItemInput = {
      recipeId: toNumber(formData.get('recipeId')),
      version: toNumber(formData.get('version')),
      ingredientId: toNumber(formData.get('ingredientId')),
      quantity: toNumber(formData.get('quantity')),
      unit: String(formData.get('unit') ?? ''),
      wasteRate: Number(formData.get('wasteRate') ?? 0),
    };

    await addRecipeItem(payload);
    revalidatePath(`/dashboard/recipes/${payload.recipeId}`);
    return { success: '材料を追加しました' };
  } catch (error) {
    console.error('addRecipeItemAction failed', error);
    return {
      error: error instanceof Error ? error.message : '材料の追加に失敗しました',
    };
  }
}

export async function previewRecipeCostAction(
  formData: FormData,
) {
  const items = collectItems(formData) as PreviewRecipeInput['items'];

  const payload: PreviewRecipeInput = {
    name: String(formData.get('name') ?? ''),
    batchOutputQty: toNumber(formData.get('batchOutputQty')),
    batchOutputUnit: String(formData.get('batchOutputUnit') ?? ''),
    servingSizeQty: toNumber(formData.get('servingSizeQty')),
    servingSizeUnit: String(formData.get('servingSizeUnit') ?? ''),
    platingYieldRatePercent: toOptionalNumber(
      formData.get('platingYieldRatePercent'),
    ),
    sellingPriceMinor: toOptionalNumber(formData.get('sellingPriceMinor')),
    sellingPriceTaxIncluded: getBoolean(formData.get('sellingPriceTaxIncluded')),
    sellingTaxRatePercent: toOptionalNumber(
      formData.get('sellingTaxRatePercent'),
    ),
    items,
  };

  return previewRecipeCost(payload);
}

export async function deleteRecipeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const payload: DeleteRecipeInput = {
      id: toNumber(formData.get('id')),
      version: toNumber(formData.get('version')),
    };

    await deleteRecipe(payload);
    revalidatePath('/dashboard/recipes');
    return { success: 'レシピを削除しました' };
  } catch (error) {
    console.error('deleteRecipeAction failed', error);
    return {
      error: error instanceof Error ? error.message : 'レシピの削除に失敗しました',
    };
  }
}

export async function updateRecipeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const items = collectItems(formData) as UpdateRecipeInput['items'];

    const payload: UpdateRecipeInput = {
      id: toNumber(formData.get('id')),
      version: toNumber(formData.get('version')),
      name: String(formData.get('name') ?? ''),
      batchOutputQty: toNumber(formData.get('batchOutputQty')),
      batchOutputUnit: String(formData.get('batchOutputUnit') ?? ''),
      servingSizeQty: toNumber(formData.get('servingSizeQty')),
      servingSizeUnit: String(formData.get('servingSizeUnit') ?? ''),
      platingYieldRatePercent: toOptionalNumber(
        formData.get('platingYieldRatePercent'),
      ),
      sellingPriceMinor: toOptionalNumber(formData.get('sellingPriceMinor')),
      sellingPriceTaxIncluded: getBoolean(
        formData.get('sellingPriceTaxIncluded'),
      ),
      sellingTaxRatePercent: toOptionalNumber(
        formData.get('sellingTaxRatePercent'),
      ),
      items,
    };

    await updateRecipeEntry(payload);
    revalidatePath(`/dashboard/recipes/${payload.id}`);
    revalidatePath('/dashboard/recipes');
    redirect(`/dashboard/recipes/${payload.id}`);
  } catch (error) {
    console.error('updateRecipeAction failed', error);
    return {
      error: error instanceof Error ? error.message : 'レシピの更新に失敗しました',
    };
  }
}
