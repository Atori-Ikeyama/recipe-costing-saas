import { listRecipes } from '@/application/recipes';
import { listIngredients } from '@/application/ingredients';
import { HomeDashboard } from './view';

export default async function HomePage() {
  const [recipes, ingredients] = await Promise.all([
    listRecipes(),
    listIngredients(),
  ]);

  return (
    <HomeDashboard
      recipes={recipes}
      ingredients={ingredients}
    />
  );
}
