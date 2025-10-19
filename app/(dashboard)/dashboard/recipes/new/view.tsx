'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Trash2, PlusCircle } from 'lucide-react';

import type { IngredientResponse } from '@/application/ingredients/presenter';
import { createRecipeAction } from '../actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ActionState = {
  error?: string;
  success?: string;
};

interface RecipeComposerProps {
  ingredients: IngredientResponse[];
}

interface DraftItem {
  ingredientId: number;
  quantity: number;
  unit: string;
  wasteRate: number;
}

const defaultActionState: ActionState = {};

function createDefaultItem(ingredients: IngredientResponse[]): DraftItem {
  if (ingredients.length === 0) {
    return {
      ingredientId: 0,
      quantity: 1,
      unit: 'g',
      wasteRate: 0,
    };
  }

  const first = ingredients[0]!;
  return {
    ingredientId: first.id,
    quantity: 1,
    unit: first.stockUnit,
    wasteRate: 0,
  };
}

export function RecipeComposer({ ingredients }: RecipeComposerProps) {
  const [items, setItems] = React.useState<DraftItem[]>(
    ingredients.length > 0 ? [createDefaultItem(ingredients)] : [],
  );
  const [state, action, pending] = useActionState(
    createRecipeAction,
    defaultActionState,
  );

  const handleAddItem = React.useCallback(() => {
    setItems((prev) => [...prev, createDefaultItem(ingredients)]);
  }, [ingredients]);

  const handleChange = React.useCallback(
    (index: number, patch: Partial<DraftItem>) => {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? {
                ...item,
                ...patch,
              }
            : item,
        ),
      );
    },
    [],
  );

  const handleRemove = React.useCallback((index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  React.useEffect(() => {
    if (ingredients.length === 0) {
      setItems([]);
      return;
    }

    setItems((prev) =>
      prev.length === 0
        ? [createDefaultItem(ingredients)]
        : prev.map((item) => {
            const exists = ingredients.some(
              (ingredient) => ingredient.id === item.ingredientId,
            );
            if (exists) {
              return item;
            }
            const fallback = createDefaultItem(ingredients);
            return {
              ...item,
              ingredientId: fallback.ingredientId,
              unit: fallback.unit,
            };
          }),
    );
  }, [ingredients]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">新規レシピ作成</h1>
        <p className="text-muted-foreground mt-1">
          ベース情報と材料構成を登録すると、詳細画面で原価計算が確認できます。
        </p>
      </div>

      {ingredients.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>材料が登録されていません</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              レシピを作成する前に、先に材料を登録してください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>レシピ情報</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-6">
              <input type="hidden" name="itemCount" value={items.length} />
              <section className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label htmlFor="name">レシピ名</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="例: チキンカレー"
                    required
                  />
                </Field>
                <Field>
                  <Label htmlFor="sellingPriceMinor">販売価格 (任意)</Label>
                  <Input
                    id="sellingPriceMinor"
                    name="sellingPriceMinor"
                    type="number"
                    min="0"
                    placeholder="税込価格(円)"
                  />
                </Field>
                <Field>
                  <Label htmlFor="batchOutputQty">仕上がり量</Label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Input
                      id="batchOutputQty"
                      name="batchOutputQty"
                      type="number"
                      step="0.001"
                      min="0"
                      required
                    />
                    <Input
                      id="batchOutputUnit"
                      name="batchOutputUnit"
                      placeholder="g"
                      required
                    />
                  </div>
                </Field>
                <Field>
                  <Label htmlFor="servingSizeQty">提供量</Label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Input
                      id="servingSizeQty"
                      name="servingSizeQty"
                      type="number"
                      step="0.001"
                      min="0"
                      required
                    />
                    <Input
                      id="servingSizeUnit"
                      name="servingSizeUnit"
                      placeholder="g"
                      required
                    />
                  </div>
                </Field>
                <Field>
                  <Label htmlFor="platingYieldRatePercent">
                    盛り付け歩留まり (任意)
                  </Label>
                  <Input
                    id="platingYieldRatePercent"
                    name="platingYieldRatePercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="100"
                  />
                </Field>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Field>
                    <Label htmlFor="sellingTaxRatePercent">
                      販売税率(%) (任意)
                    </Label>
                    <Input
                      id="sellingTaxRatePercent"
                      name="sellingTaxRatePercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </Field>
                  <div className="self-end">
                    <Label className="text-xs text-muted-foreground">
                      税込価格?
                    </Label>
                    <select
                      name="sellingPriceTaxIncluded"
                      defaultValue=""
                      className="border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-9 w-full rounded-md border px-3 py-2"
                    >
                      <option value="">未指定</option>
                      <option value="true">税込</option>
                      <option value="false">税抜</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">材料構成</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                  >
                    <PlusCircle className="size-4" />
                    行を追加
                  </Button>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      行を追加して材料を設定してください。
                    </p>
                  ) : (
                    items.map((item, index) => {
                      const ingredient = ingredients.find(
                        (entry) => entry.id === item.ingredientId,
                      );
                      const purchaseUnit = ingredient
                        ? ingredient.purchaseUnit
                        : 'unit';

                      return (
                        <div
                          key={index}
                          className="grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_120px_120px_auto]"
                        >
                          <div className="space-y-2">
                            <Label>材料</Label>
                            <select
                              name={`items.${index}.ingredientId`}
                              value={item.ingredientId}
                              onChange={(event) => {
                                const nextIngredientId = Number(event.target.value);
                                const matched = ingredients.find(
                                  (entry) => entry.id === nextIngredientId,
                                );
                                handleChange(index, {
                                  ingredientId: nextIngredientId,
                                  unit: matched?.stockUnit ?? item.unit,
                                });
                              }}
                              className="border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 w-full rounded-md border px-3"
                            >
                              {ingredients.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>使用量</Label>
                            <Input
                              name={`items.${index}.quantity`}
                              type="number"
                              min="0"
                              step="0.001"
                              value={item.quantity}
                              onChange={(event) =>
                                handleChange(index, {
                                  quantity: Number(event.target.value),
                                })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>単位</Label>
                            <Input
                              name={`items.${index}.unit`}
                              value={item.unit}
                              onChange={(event) =>
                                handleChange(index, {
                                  unit: event.target.value,
                                })
                              }
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              推奨: {ingredient?.stockUnit ?? purchaseUnit}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>廃棄率</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                name={`items.${index}.wasteRate`}
                                type="number"
                                min="0"
                                max="0.99"
                                step="0.01"
                                value={item.wasteRate}
                                onChange={(event) =>
                                  handleChange(index, {
                                    wasteRate: Number(event.target.value),
                                  })
                                }
                                required
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleRemove(index)}
                                aria-label="行を削除"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={pending}>
                  {pending ? '作成中...' : 'レシピを作成'}
                </Button>
                {state.error ? (
                  <p className="text-sm text-destructive">{state.error}</p>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
