import { z } from 'zod';

import { SupplierRepository } from '@/infrastructure/repositories/supplier.repo';
import { requireTeamContext } from '@/lib/auth/team';

const deleteSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type DeleteSupplierInput = z.infer<typeof deleteSchema>;

const repository = new SupplierRepository();

export async function deleteSupplier(input: DeleteSupplierInput) {
  const data = deleteSchema.parse(input);
  const { teamId } = await requireTeamContext();

  const existing = await repository.findById(teamId, data.id);
  if (!existing) {
    throw new Error('仕入先が見つかりません');
  }

  await repository.delete(teamId, data.id);
}
