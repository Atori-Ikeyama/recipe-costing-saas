import { z } from 'zod';

import { createSupplier } from '@/domain/catalog/supplier';
import { SupplierRepository } from '@/infrastructure/repositories/supplier.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { supplierToResponse } from './presenter';

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(1, '名称は必須です').max(120, '名称は120文字以内で入力してください'),
  leadTimeDays: z
    .coerce.number()
    .int('リードタイムは整数で入力してください')
    .min(0, 'リードタイムは0以上で入力してください'),
});

export type UpdateSupplierInput = z.infer<typeof updateSchema>;

const repository = new SupplierRepository();

export async function updateSupplier(input: UpdateSupplierInput) {
  const data = updateSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const existing = await repository.findById(teamId, data.id);
  if (!existing) {
    throw new Error('仕入先が見つかりません');
  }

  const updated = createSupplier({
    ...existing,
    name: data.name,
    leadTimeDays: data.leadTimeDays,
  });

  const saved = await repository.update(updated);
  return supplierToResponse(saved);
}
