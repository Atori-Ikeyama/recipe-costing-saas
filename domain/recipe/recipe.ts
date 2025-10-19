import { Money } from '../shared/money';
import {
  Quantity,
  Unit,
  convertQuantity,
  ensureSameCategory,
  scaleQuantity,
} from '../shared/unit';
import { ValidationError } from '../shared/errors';

export interface RecipeItemProps {
  id?: number;
  ingredientId: number;
  quantity: Quantity;
  wasteRate: number;
}

export interface RecipeProps {
  id: number;
  teamId: number;
  name: string;
  batchOutput: Quantity;
  servingSize: Quantity;
  platingYieldRatePercent?: number;
  sellingPrice?: Money;
  sellingPriceTaxIncluded?: boolean;
  sellingTaxRatePercent?: number;
  version: number;
  items: RecipeItem[];
}

export interface RecipeItem extends RecipeItemProps {}

export interface Recipe extends RecipeProps {}

export function createRecipeItem(props: RecipeItemProps): RecipeItem {
  if (props.ingredientId <= 0) {
    throw new ValidationError('Ingredient id must be positive');
  }

  if (!Number.isFinite(props.wasteRate) || props.wasteRate < 0 || props.wasteRate >= 1) {
    throw new ValidationError('Waste rate must be within [0, 1)');
  }

  return { ...props };
}

export function createRecipe(props: Omit<RecipeProps, 'items'> & { items: RecipeItemProps[] }): Recipe {
  if (props.teamId <= 0) {
    throw new ValidationError('teamId must be positive');
  }

  if (!props.name.trim()) {
    throw new ValidationError('Recipe name cannot be empty');
  }

  ensureSameCategory(props.batchOutput.unit, props.servingSize.unit);

  if (
    props.platingYieldRatePercent !== undefined &&
    (props.platingYieldRatePercent <= 0 || props.platingYieldRatePercent > 100)
  ) {
    throw new ValidationError('Plating yield rate must be within (0, 100]');
  }

  if (
    props.sellingTaxRatePercent !== undefined &&
    (props.sellingTaxRatePercent < 0 || props.sellingTaxRatePercent > 100)
  ) {
    throw new ValidationError('Selling tax rate must be within [0, 100]');
  }

  if (props.version <= 0) {
    throw new ValidationError('Version must be positive');
  }

  const items = props.items.map(createRecipeItem);
  if (items.length === 0) {
    throw new ValidationError('Recipe must contain at least one ingredient');
  }

  return {
    ...props,
    items,
  };
}

export function servingsPerBatch(recipe: Recipe): number {
  const platingYield = recipe.platingYieldRatePercent ?? 100;
  const effectiveBatch = scaleQuantity(recipe.batchOutput, platingYield / 100);
  const serving = convertQuantity(recipe.servingSize, effectiveBatch.unit);
  return effectiveBatch.value / serving.value;
}
