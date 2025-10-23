import { listSuppliers } from '@/application/suppliers';
import { SuppliersDashboard } from './view';

type PageProps = {
  searchParams?: {
    q?: string | string[];
  };
};

export default async function SuppliersPage({ searchParams }: PageProps) {
  const rawQuery = searchParams?.q;
  const query = typeof rawQuery === 'string' ? rawQuery : undefined;
  const suppliers = await listSuppliers({ query });
  return (
    <SuppliersDashboard
      initialSuppliers={suppliers}
      initialQuery={query ?? ''}
    />
  );
}
