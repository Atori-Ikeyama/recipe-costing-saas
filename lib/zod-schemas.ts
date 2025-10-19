import { z } from 'zod';

import { getUnit } from '@/domain/shared/unit';

export const unitCodeSchema = z
  .string()
  .min(1, '単位コードは必須です')
  .refine((code) => {
    try {
      getUnit(code);
      return true;
    } catch {
      return false;
    }
  }, '未対応の単位コードです');

export const moneyMinorSchema = z
  .number({ invalid_type_error: '金額は数値で指定してください' })
  .int('金額は整数で指定してください')
  .nonnegative('金額は0以上で指定してください');

export const percentageSchema = z
  .number({ invalid_type_error: '割合は数値で指定してください' })
  .min(0)
  .max(100);

export const positiveNumberSchema = z
  .number({ invalid_type_error: '数値で指定してください' })
  .positive('0より大きい値を指定してください');

export const nonNegativeNumberSchema = z
  .number({ invalid_type_error: '数値で指定してください' })
  .min(0);
