import { Money, RoundingPolicy, roundHalfUp } from '../shared/money';
import {
  Conversion,
  Quantity,
  Unit,
  applyConversion,
  ensureSameCategory,
  isSameUnit,
} from '../shared/unit';
import { ValidationError } from '../shared/errors';
import { priceExcludingTax } from '../shared/tax';

export interface IngredientProps {
  id: number;
  teamId: number;
  name: string;
  purchaseQuantity: Quantity;
  stockUnit: Unit;
  conversion: Conversion;
  purchasePrice: Money;
  taxIncluded: boolean;
  taxRatePercent: number;
  yieldRatePercent: number;
  supplierId?: number;
  version: number;
}

export interface Ingredient extends IngredientProps {}

export function createIngredient(props: IngredientProps): Ingredient {
  if (props.teamId <= 0) {
    throw new ValidationError('teamId must be positive');
  }

  if (!props.name.trim()) {
    throw new ValidationError('Ingredient name cannot be empty');
  }

  if (!isSameUnit(props.purchaseQuantity.unit, props.conversion.from)) {
    throw new ValidationError(
      `Conversion origin ${props.conversion.from.code} does not match purchase quantity unit ${props.purchaseQuantity.unit.code}`,
    );
  }

  if (!isSameUnit(props.stockUnit, props.conversion.to)) {
    throw new ValidationError(
      `Conversion target ${props.conversion.to.code} does not match stock unit ${props.stockUnit.code}`,
    );
  }

  ensureSameCategory(props.purchaseQuantity.unit, props.stockUnit);

  if (
    !Number.isFinite(props.yieldRatePercent) ||
    props.yieldRatePercent <= 0 ||
    props.yieldRatePercent > 100
  ) {
    throw new ValidationError('Yield rate must be within (0, 100]');
  }

  if (!Number.isFinite(props.taxRatePercent) || props.taxRatePercent < 0) {
    throw new ValidationError('Tax rate must be non-negative');
  }

  if (props.version <= 0) {
    throw new ValidationError('Version must be positive');
  }

  return { ...props };
}

export function purchaseQuantityInStockUnits(ingredient: Ingredient): Quantity {
  return applyConversion(ingredient.purchaseQuantity, ingredient.conversion);
}

export function purchasePriceExcludingTax(
  ingredient: Ingredient,
  rounding: RoundingPolicy = roundHalfUp,
): Money {
  return priceExcludingTax(ingredient.purchasePrice, {
    taxIncluded: ingredient.taxIncluded,
    taxRatePercent: ingredient.taxRatePercent,
    rounding,
  });
}
