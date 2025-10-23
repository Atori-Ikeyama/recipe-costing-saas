import { listIngredients } from '@/application/ingredients';
import { listSuppliers } from '@/application/suppliers';
import { IngredientsDashboard } from './view';

type PageProps = {
  searchParams?: {
    q?: string | string[];
  };
};

export default async function IngredientsPage({ searchParams }: PageProps) {
  const rawQuery = searchParams?.q;
  const query = typeof rawQuery === 'string' ? rawQuery : undefined;
  const [ingredients, suppliers] = await Promise.all([
    listIngredients({ query }),
    listSuppliers(),
  ]);
  return (
    <IngredientsDashboard
      initialIngredients={ingredients}
      initialQuery={query ?? ''}
      supplierOptions={suppliers}
    />
  );
}
