import { ValidationError } from '@/domain/shared/errors';

export function parseNumeric(source: string | number | null | undefined): number {
  if (source === null || source === undefined) {
    throw new ValidationError('Numeric value is missing');
  }

  const value = typeof source === 'number' ? source : Number(source);

  if (!Number.isFinite(value)) {
    throw new ValidationError(`Invalid numeric value: ${source}`);
  }

  return value;
}

export function formatNumeric(value: number, scale: number): string {
  if (!Number.isFinite(value)) {
    throw new ValidationError('Numeric value must be finite');
  }

  return value.toFixed(scale);
}
