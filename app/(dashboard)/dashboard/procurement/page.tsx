import { listRecipes } from '@/application/recipes';
import { ProcurementDashboard } from './view';

export default async function ProcurementPage() {
  const recipes = await listRecipes();
  return <ProcurementDashboard recipes={recipes} />;
}
