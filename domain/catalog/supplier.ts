import { ValidationError } from '../shared/errors';

export interface SupplierProps {
  id: number;
  teamId: number;
  name: string;
  leadTimeDays: number;
}

export interface Supplier extends SupplierProps {}

export function createSupplier(props: SupplierProps): Supplier {
  if (props.teamId <= 0) {
    throw new ValidationError('teamId must be positive');
  }

  if (props.id < 0) {
    throw new ValidationError('id must be non-negative');
  }

  const trimmedName = props.name.trim();
  if (!trimmedName) {
    throw new ValidationError('Supplier name cannot be empty');
  }

  if (trimmedName.length > 120) {
    throw new ValidationError('Supplier name must be 120 characters or fewer');
  }

  if (!Number.isInteger(props.leadTimeDays) || props.leadTimeDays < 0) {
    throw new ValidationError('Lead time days must be a non-negative integer');
  }

  return {
    ...props,
    name: trimmedName,
  };
}
