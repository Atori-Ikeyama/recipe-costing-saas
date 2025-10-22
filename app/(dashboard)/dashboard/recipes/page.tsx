import { listRecipes } from '@/application/recipes';
import { RecipeListView } from './view';

type PageProps = {
  searchParams?: {
    q?: string | string[];
  };
};

export default async function RecipesPage({ searchParams }: PageProps) {
  const rawQuery = searchParams?.q;
  const query = typeof rawQuery === 'string' ? rawQuery : undefined;
  const recipes = await listRecipes({ query });

  return <RecipeListView recipes={recipes} initialQuery={query ?? ''} />;
}
