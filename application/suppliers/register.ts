import { z } from 'zod';

import { createSupplier } from '@/domain/catalog/supplier';
import { SupplierRepository } from '@/infrastructure/repositories/supplier.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { supplierToResponse } from './presenter';

const registerSchema = z.object({
  name: z.string().min(1, '名称は必須です').max(120, '名称は120文字以内で入力してください'),
  leadTimeDays: z
    .coerce.number()
    .int('リードタイムは整数で入力してください')
    .min(0, 'リードタイムは0以上で入力してください')
    .default(0),
});

export type RegisterSupplierInput = z.infer<typeof registerSchema>;

const repository = new SupplierRepository();

export async function registerSupplier(input: RegisterSupplierInput) {
  const data = registerSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const supplier = createSupplier({
    id: 0,
    teamId,
    name: data.name,
    leadTimeDays: data.leadTimeDays,
  });

  const saved = await repository.create(supplier);
  return supplierToResponse(saved);
}
