import { listIngredients } from '@/application/ingredients';
import { IngredientsDashboard } from './view';

export default async function IngredientsPage() {
  const ingredients = await listIngredients();
  return <IngredientsDashboard initialIngredients={ingredients} />;
}
