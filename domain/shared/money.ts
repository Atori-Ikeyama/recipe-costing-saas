import { ValidationError } from './errors';

export type CurrencyCode = 'JPY';

export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

export type RoundingPolicy = (value: number) => number;

export const roundHalfUp: RoundingPolicy = (value) => {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  return sign * Math.floor(abs + 0.5);
};

const MINOR_PER_MAJOR: Record<CurrencyCode, number> = {
  JPY: 1,
};

export const Money = {
  ofMinor(amountMinor: number, currency: CurrencyCode = 'JPY'): Money {
    if (!Number.isFinite(amountMinor)) {
      throw new ValidationError('Amount must be a finite number');
    }

    if (!Number.isInteger(amountMinor)) {
      throw new ValidationError('Amount must be expressed in minor integer units');
    }

    return Object.freeze({
      amountMinor,
      currency,
    });
  },

  add(a: Money, b: Money): Money {
    ensureSameCurrency(a, b);
    return Money.ofMinor(a.amountMinor + b.amountMinor, a.currency);
  },

  sub(a: Money, b: Money): Money {
    ensureSameCurrency(a, b);
    return Money.ofMinor(a.amountMinor - b.amountMinor, a.currency);
  },

  mul(money: Money, factor: number, policy: RoundingPolicy = roundHalfUp): Money {
    if (!Number.isFinite(factor)) {
      throw new ValidationError('Multiplication factor must be finite');
    }

    const raw = money.amountMinor * factor;
    return Money.ofMinor(policy(raw), money.currency);
  },

  toMajor(money: Money): number {
    const factor = MINOR_PER_MAJOR[money.currency];
    return money.amountMinor / factor;
  },

  equals(a: Money, b: Money): boolean {
    return a.currency === b.currency && a.amountMinor === b.amountMinor;
  },
};

function ensureSameCurrency(a: Money, b: Money) {
  if (a.currency !== b.currency) {
    throw new ValidationError('Currency mismatch');
  }
}
