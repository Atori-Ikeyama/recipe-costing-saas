import { ValidationError } from './errors';

export type UnitCategory = 'weight' | 'volume' | 'count';

export interface Unit {
  readonly code: string;
  readonly cat: UnitCategory;
}

export interface Quantity {
  readonly value: number;
  readonly unit: Unit;
}

export interface Conversion {
  readonly from: Unit;
  readonly to: Unit;
  readonly factor: number;
}

interface UnitDefinition extends Unit {
  readonly ratioToBase: number;
}

const UNIT_REGISTRY = new Map<string, UnitDefinition>([
  ['g', { code: 'g', cat: 'weight', ratioToBase: 1 }],
  ['kg', { code: 'kg', cat: 'weight', ratioToBase: 1000 }],
  ['mg', { code: 'mg', cat: 'weight', ratioToBase: 0.001 }],
  ['ml', { code: 'ml', cat: 'volume', ratioToBase: 1 }],
  ['l', { code: 'l', cat: 'volume', ratioToBase: 1000 }],
  ['ea', { code: 'ea', cat: 'count', ratioToBase: 1 }],
  ['pc', { code: 'pc', cat: 'count', ratioToBase: 1 }],
]);

export function registerUnit(definition: UnitDefinition): void {
  UNIT_REGISTRY.set(definition.code, definition);
}

export function getUnit(code: string): Unit {
  const unit = UNIT_REGISTRY.get(code);
  if (!unit) {
    throw new ValidationError(`Unknown unit code: ${code}`);
  }

  return unit;
}

export function createQuantity(value: number, unitInput: string | Unit): Quantity {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ValidationError('Quantity value must be greater than zero');
  }

  const unit = typeof unitInput === 'string' ? getUnit(unitInput) : unitInput;
  return { value, unit };
}

export function createConversion(
  fromInput: string | Unit,
  toInput: string | Unit,
  factor: number,
): Conversion {
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new ValidationError('Conversion factor must be greater than zero');
  }

  const from = typeof fromInput === 'string' ? getUnit(fromInput) : fromInput;
  const to = typeof toInput === 'string' ? getUnit(toInput) : toInput;

  ensureSameCategory(from, to);

  return { from, to, factor };
}

export function applyConversion(quantity: Quantity, conversion: Conversion): Quantity {
  if (!isSameUnit(quantity.unit, conversion.from)) {
    throw new ValidationError(
      `Conversion mismatch: quantity in ${quantity.unit.code} cannot be converted using factor for ${conversion.from.code}`,
    );
  }

  return {
    value: quantity.value * conversion.factor,
    unit: conversion.to,
  };
}

export function invertConversion(conversion: Conversion): Conversion {
  return createConversion(conversion.to, conversion.from, 1 / conversion.factor);
}

export function convertQuantity(quantity: Quantity, target: string | Unit): Quantity {
  const targetUnit = typeof target === 'string' ? getUnit(target) : target;
  ensureSameCategory(quantity.unit, targetUnit);

  const sourceDef = getDefinition(quantity.unit.code);
  const targetDef = getDefinition(targetUnit.code);
  const valueInBase = quantity.value * sourceDef.ratioToBase;
  const convertedValue = valueInBase / targetDef.ratioToBase;
  return {
    value: convertedValue,
    unit: targetUnit,
  };
}

export function scaleQuantity(quantity: Quantity, factor: number): Quantity {
  if (!Number.isFinite(factor) || factor < 0) {
    throw new ValidationError('Scale factor must be non-negative');
  }

  return {
    value: quantity.value * factor,
    unit: quantity.unit,
  };
}

export function isSameUnit(a: Unit, b: Unit): boolean {
  return a.code === b.code && a.cat === b.cat;
}

export function ensureSameCategory(a: Unit, b: Unit): void {
  if (a.cat !== b.cat) {
    throw new ValidationError(
      `Unit category mismatch: ${a.code} (${a.cat}) vs ${b.code} (${b.cat})`,
    );
  }
}

function getDefinition(code: string): UnitDefinition {
  const def = UNIT_REGISTRY.get(code);
  if (!def) {
    throw new ValidationError(`Unknown unit code: ${code}`);
  }
  return def;
}
