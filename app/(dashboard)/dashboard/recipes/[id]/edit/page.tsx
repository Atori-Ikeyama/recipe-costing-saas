import { notFound } from 'next/navigation';

import { getRecipeWithCost } from '@/application/recipes';
import { RecipeEditView } from './view';

interface RecipeEditPageProps {
  params: {
    id: string;
  };
}

export default async function RecipeEditPage({ params }: RecipeEditPageProps) {
  const recipeId = Number(params.id);
  if (!Number.isInteger(recipeId) || recipeId <= 0) {
    notFound();
  }

  const data = await getRecipeWithCost(recipeId).catch((error) => {
    console.error('RecipeEditPage failed to load recipe', error);
    return null;
  });

  if (!data) {
    notFound();
  }

  return <RecipeEditView recipe={data.recipe} ingredients={data.ingredients} />;
}
