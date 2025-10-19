'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Info, PlusCircle } from 'lucide-react';

import type { IngredientResponse } from '@/application/ingredients/presenter';
import type { RecipeResponse } from '@/application/recipes/presenter';
import type { RecipeCostResult } from '@/domain/costing/costing-service';
import { addRecipeItemAction } from '../actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ActionState = {
  error?: string;
  success?: string;
};

interface RecipeDetailViewProps {
  recipe: RecipeResponse;
  ingredients: IngredientResponse[];
  cost: RecipeCostResult;
}

const defaultActionState: ActionState = {};

export function RecipeDetailView({
  recipe,
  ingredients,
  cost,
}: RecipeDetailViewProps) {
  const [state, action, pending] = useActionState(
    addRecipeItemAction,
    defaultActionState,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{recipe.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Stat
                label="仕上がり量"
                value={`${recipe.batchOutputQty} ${recipe.batchOutputUnit}`}
              />
              <Stat
                label="提供量"
                value={`${recipe.servingSizeQty} ${recipe.servingSizeUnit}`}
              />
              <Stat
                label="盛付歩留まり"
                value={`${recipe.platingYieldRatePercent ?? 100}%`}
              />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>販売価格: {recipe.sellingPriceMinor ? `¥${recipe.sellingPriceMinor.toLocaleString()}` : '未設定'}</p>
              {recipe.sellingPriceTaxIncluded !== undefined ? (
                <p>
                  税区分:{' '}
                  {recipe.sellingPriceTaxIncluded ? '税込' : '税抜'}
                  {recipe.sellingTaxRatePercent !== undefined
                    ? ` (${recipe.sellingTaxRatePercent}%)`
                    : ''}
                </p>
              ) : null}
              <p>バージョン: v{recipe.version}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>材料一覧</CardTitle>
            <span className="text-sm text-muted-foreground">
              {recipe.items.length} 件
            </span>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>材料</TableHead>
                  <TableHead className="text-right">使用量</TableHead>
                  <TableHead className="text-right">廃棄率</TableHead>
                  <TableHead className="text-right">コスト</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipe.items.map((item) => {
                  const breakdown = cost.breakdown.find(
                    (entry) => entry.ingredientId === item.ingredientId,
                  );
                  const ingredient = ingredients.find(
                    (entry) => entry.id === item.ingredientId,
                  );

                  return (
                    <TableRow key={item.id ?? item.ingredientId}>
                      <TableCell>
                        <div className="font-medium">
                          {ingredient?.name ?? `#${item.ingredientId}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          仕入単位: {ingredient?.purchaseUnit}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.wasteRate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {breakdown
                          ? `¥${breakdown.itemCostMinor.toLocaleString()}`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableCaption>材料追加後にページを更新すると即時計算が反映されます。</TableCaption>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>材料を追加</CardTitle>
          </CardHeader>
          <CardContent>
            <AddRecipeItemForm
              recipe={recipe}
              ingredients={ingredients}
              action={action}
              state={state}
              pending={pending}
            />
          </CardContent>
        </Card>
      </div>

      <aside className="flex flex-col gap-6">
        <CostSummary cost={cost} />
        <CostBreakdown cost={cost} ingredients={ingredients} />
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

interface AddRecipeItemFormProps {
  recipe: RecipeResponse;
  ingredients: IngredientResponse[];
  action: (
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState | void>;
  state: ActionState;
  pending: boolean;
}

function AddRecipeItemForm({
  recipe,
  ingredients,
  action,
  state,
  pending,
}: AddRecipeItemFormProps) {
  const [selectedIngredient, setSelectedIngredient] = React.useState<number>(
    ingredients[0]?.id ?? 0,
  );
  const [quantity, setQuantity] = React.useState<number>(100);
  const [unit, setUnit] = React.useState<string>(
    ingredients[0]?.stockUnit ?? 'g',
  );
  const [wasteRate, setWasteRate] = React.useState<number>(0);

  const matchedIngredient = ingredients.find(
    (ingredient) => ingredient.id === selectedIngredient,
  );

  React.useEffect(() => {
    if (!matchedIngredient) {
      return;
    }
    setUnit(matchedIngredient.stockUnit);
  }, [matchedIngredient]);

  if (ingredients.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        <Info className="size-4" />
        材料が登録されていないため追加できません。
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="recipeId" value={recipe.id} />
      <input type="hidden" name="version" value={recipe.version} />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
        <Field>
          <Label>材料</Label>
          <select
            name="ingredientId"
            value={selectedIngredient}
            onChange={(event) => setSelectedIngredient(Number(event.target.value))}
            className="border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 w-full rounded-md border px-3"
          >
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <Label>単位</Label>
          <Input
            name="unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            required
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field>
          <Label>使用量</Label>
          <Input
            name="quantity"
            type="number"
            min="0"
            step="0.001"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            required
          />
        </Field>
        <Field>
          <Label>廃棄率</Label>
          <Input
            name="wasteRate"
            type="number"
            min="0"
            max="0.99"
            step="0.01"
            value={wasteRate}
            onChange={(event) => setWasteRate(Number(event.target.value))}
            required
          />
        </Field>
        <Field>
          <Label>仕入単位</Label>
          <Input
            value={matchedIngredient?.purchaseUnit ?? ''}
            readOnly
            className="bg-muted/50"
          />
        </Field>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        <PlusCircle className="mr-2 size-4" />
        {pending ? '追加中...' : '材料を追加'}
      </Button>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
    </form>
  );
}

function CostSummary({ cost }: { cost: RecipeCostResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>原価サマリー</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SummaryRow
          label="バッチ原価"
          value={`¥${cost.batchCostMinor.toLocaleString()}`}
        />
        <SummaryRow
          label="1提供あたり"
          value={`¥${cost.unitCostMinor.toLocaleString()}`}
        />
        <SummaryRow
          label="提供可能数"
          value={`${cost.portionsPerBatch} 食`}
        />
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function CostBreakdown({
  cost,
  ingredients,
}: {
  cost: RecipeCostResult;
  ingredients: IngredientResponse[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>材料別コスト内訳</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cost.breakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            コスト計算に対応する材料がありません。
          </p>
        ) : (
          cost.breakdown.map((item) => {
            const ingredient = ingredients.find(
              (entry) => entry.id === item.ingredientId,
            );
            const label = ingredient?.name ?? `材料 ${item.ingredientId}`;

            return (
              <div
                key={item.ingredientId}
                className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">
                    実使用量: {item.actualQty.toFixed(2)}
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  ¥{item.itemCostMinor.toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
