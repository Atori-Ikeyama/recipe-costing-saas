import { describe, expect, it } from 'vitest';

import { Money, roundHalfUp } from '@/domain/shared/money';
import { ValidationError } from '@/domain/shared/errors';

describe('Money value object', () => {
  it('同一通貨の金額を加減算できる', () => {
    const a = Money.ofMinor(1200);
    const b = Money.ofMinor(800);

    const sum = Money.add(a, b);
    expect(sum.amountMinor).toBe(2000);

    const diff = Money.sub(a, b);
    expect(diff.amountMinor).toBe(400);
  });

  it('倍率を掛ける際に丸め規則を適用する', () => {
    const price = Money.ofMinor(333);
    const taxed = Money.mul(price, 1.1);
    expect(taxed.amountMinor).toBe(366);

    const customRounded = Money.mul(price, 1.1, Math.ceil);
    expect(customRounded.amountMinor).toBe(367);
  });

  it('通貨が異なる場合は例外を投げる', () => {
    const jpy = Money.ofMinor(1000, 'JPY');
    const usdLike = { amountMinor: 1000, currency: 'USD' as never };

    expect(() => Money.add(jpy, usdLike)).toThrowError(ValidationError);
  });

  it('roundHalfUp は負の値も正しく丸める', () => {
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(-1.5)).toBe(-2);
  });

  it('整数でない minor を拒否する', () => {
    expect(() => Money.ofMinor(12.5)).toThrowError(ValidationError);
  });
});
