import { Money, RoundingPolicy, roundHalfUp } from './money';
import { ValidationError } from './errors';

export interface TaxConfig {
  taxRatePercent: number;
  taxIncluded: boolean;
  rounding?: RoundingPolicy;
}

export function priceExcludingTax(
  price: Money,
  config: TaxConfig,
): Money {
  const rate = config.taxRatePercent;
  if (!Number.isFinite(rate) || rate < 0) {
    throw new ValidationError('Tax rate must be a non-negative number');
  }

  if (!config.taxIncluded || rate === 0) {
    return price;
  }

  const rounding = config.rounding ?? roundHalfUp;
  const divisor = 1 + rate / 100;
  const raw = price.amountMinor / divisor;
  return Money.ofMinor(rounding(raw), price.currency);
}

export function taxAmount(
  price: Money,
  config: TaxConfig,
): Money {
  if (!config.taxIncluded) {
    return Money.ofMinor(0, price.currency);
  }

  const net = priceExcludingTax(price, config);
  return Money.sub(price, net);
}
