import { listIngredients } from '@/application/ingredients';
import { RecipeComposer } from './view';

export default async function NewRecipePage() {
  const ingredients = await listIngredients();
  return <RecipeComposer ingredients={ingredients} />;
}
