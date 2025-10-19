import { notFound } from 'next/navigation';

import { getRecipeWithCost } from '@/application/recipes';
import { RecipeDetailView } from './view';

interface RecipeDetailPageProps {
  params: {
    id: string;
  };
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const recipeId = Number(params.id);
  if (Number.isNaN(recipeId)) {
    notFound();
  }

  const data = await getRecipeWithCost(recipeId).catch((error) => {
    console.error('Failed to load recipe', error);
    return null;
  });

  if (!data) {
    notFound();
  }

  return (
    <RecipeDetailView
      recipe={data.recipe}
      ingredients={data.ingredients}
      cost={data.cost}
    />
  );
}
