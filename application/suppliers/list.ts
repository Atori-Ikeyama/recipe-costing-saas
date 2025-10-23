import { SupplierRepository } from '@/infrastructure/repositories/supplier.repo';
import { requireTeamContext } from '@/lib/auth/team';
import { supplierToResponse } from './presenter';

const repository = new SupplierRepository();

type ListSuppliersOptions = {
  query?: string;
};

const MAX_QUERY_LENGTH = 120;

const normalizeQuery = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed.slice(0, MAX_QUERY_LENGTH);
};

export async function listSuppliers(
  options: ListSuppliersOptions = {},
) {
  const { teamId } = await requireTeamContext();
  const search = normalizeQuery(options.query);
  const items = await repository.listByTeam(teamId, { search });
  return items.map(supplierToResponse);
}
