import { listRecipes } from '@/application/recipes';
import { listIngredients } from '@/application/ingredients';
import { ProcurementDashboard } from './view';

export default async function ProcurementPage() {
  const [recipes, ingredients] = await Promise.all([
    listRecipes(),
    listIngredients(),
  ]);

  return (
    <ProcurementDashboard
      recipes={recipes}
      ingredients={ingredients}
    />
  );
}
