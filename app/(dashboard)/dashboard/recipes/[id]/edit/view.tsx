"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, PlusCircle } from "lucide-react";

import type { IngredientResponse } from "@/application/ingredients/presenter";
import type { RecipeResponse } from "@/application/recipes/presenter";
import { updateRecipeAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ActionState = {
  error?: string;
  success?: string;
};

interface RecipeEditViewProps {
  recipe: RecipeResponse;
  ingredients: IngredientResponse[];
}

interface DraftItem {
  key: string;
  ingredientId: number;
  quantity: number;
  unit: string;
  wasteRate: number;
}

const defaultActionState: ActionState = {};

function createKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `item-${Math.random().toString(36).slice(2)}`;
}

function createDefaultItem(ingredients: IngredientResponse[]): DraftItem {
  if (ingredients.length === 0) {
    return {
      key: createKey(),
      ingredientId: 0,
      quantity: 1,
      unit: "g",
      wasteRate: 0,
    };
  }

  const first = ingredients[0]!;
  return {
    key: createKey(),
    ingredientId: first.id,
    quantity: 1,
    unit: first.stockUnit,
    wasteRate: 0,
  };
}

export function RecipeEditView({
  recipe,
  ingredients,
}: RecipeEditViewProps) {
  const [items, setItems] = React.useState<DraftItem[]>(
    recipe.items.map((item, index) => ({
      key: String(item.id ?? `${item.ingredientId}-${index}`),
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit,
      wasteRate: item.wasteRate,
    }))
  );
  const [state, action, pending] = useActionState(
    updateRecipeAction,
    defaultActionState
  );
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const router = useRouter();

  const handleAddItem = React.useCallback(() => {
    setItems((prev) => [...prev, createDefaultItem(ingredients)]);
  }, [ingredients]);

  const handleItemChange = React.useCallback(
    (key: string, patch: Partial<DraftItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const handleRemove = React.useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const handleSubmit = React.useCallback(() => {
    setHasSubmitted(true);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          レシピを編集
        </h1>
        <p className="text-muted-foreground mt-1">
          {recipe.name} の基本情報と材料構成を更新します。
        </p>
      </div>

      {ingredients.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>材料が登録されていません</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              新しい材料を追加するには、先に材料マスタへ登録してください。
              既存の材料構成はそのまま保存されますが、更新内容の整合性に注意してください。
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>レシピ情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="id" value={recipe.id} />
            <input type="hidden" name="version" value={recipe.version} />
            <input type="hidden" name="servingSizeQty" value={recipe.servingSizeQty} />
            <input type="hidden" name="servingSizeUnit" value={recipe.servingSizeUnit} />
            <input type="hidden" name="itemCount" value={items.length} />

            <section className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor="name">レシピ名</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={recipe.name}
                />
              </Field>
              <Field>
                <Label htmlFor="batchOutputQty">仕上がり食数</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="batchOutputQty"
                    name="batchOutputQty"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    defaultValue={recipe.batchOutputQty}
                  />
                  <span className="text-sm text-muted-foreground">
                    {recipe.batchOutputUnit === "meal" ? "食" : recipe.batchOutputUnit}
                  </span>
                </div>
                <input
                  type="hidden"
                  id="batchOutputUnit"
                  name="batchOutputUnit"
                  value={recipe.batchOutputUnit}
                />
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
                  defaultValue={recipe.platingYieldRatePercent ?? ""}
                />
              </Field>
              <div className="md:col-span-2">
                <Field>
                  <div className="text-sm font-medium text-foreground">
                    販売価格・税設定 (任意)
                  </div>
                  <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px_120px]">
                    <div className="space-y-1">
                      <Label
                        htmlFor="sellingPriceMinor"
                        className="text-xs text-muted-foreground"
                      >
                        販売価格
                      </Label>
                      <Input
                        id="sellingPriceMinor"
                        name="sellingPriceMinor"
                        type="number"
                        min="0"
                        defaultValue={
                          recipe.sellingPriceMinor !== undefined
                            ? recipe.sellingPriceMinor
                            : ""
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="sellingPriceTaxIncluded"
                        className="text-xs text-muted-foreground"
                      >
                        税区分
                      </Label>
                      <select
                        id="sellingPriceTaxIncluded"
                        name="sellingPriceTaxIncluded"
                        defaultValue={
                          recipe.sellingPriceTaxIncluded === undefined
                            ? ""
                            : recipe.sellingPriceTaxIncluded
                            ? "true"
                            : "false"
                        }
                        className="border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-9 w-full rounded-md border px-3 py-2"
                      >
                        <option value="">未指定</option>
                        <option value="true">税込</option>
                        <option value="false">税抜</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="sellingTaxRatePercent"
                        className="text-xs text-muted-foreground"
                      >
                        税率(%)
                      </Label>
                      <Input
                        id="sellingTaxRatePercent"
                        name="sellingTaxRatePercent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        defaultValue={
                          recipe.sellingTaxRatePercent !== undefined
                            ? recipe.sellingTaxRatePercent
                            : ""
                        }
                      />
                    </div>
                  </div>
                </Field>
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
                  disabled={ingredients.length === 0}
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
                      (entry) => entry.id === item.ingredientId
                    );
                    const fallbackOption = ingredient
                      ? null
                      : { id: item.ingredientId, name: `削除済み材料 (ID: ${item.ingredientId})`, stockUnit: item.unit };

                    const unitHint = ingredient?.stockUnit ?? item.unit;

                    return (
                      <div
                        key={item.key}
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
                                (entry) => entry.id === nextIngredientId
                              );
                              handleItemChange(item.key, {
                                ingredientId: nextIngredientId,
                                unit: matched?.stockUnit ?? item.unit,
                              });
                            }}
                            className="border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 w-full rounded-md border px-3"
                          >
                            {fallbackOption ? (
                              <option value={fallbackOption.id}>
                                {fallbackOption.name}
                              </option>
                            ) : null}
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
                              handleItemChange(item.key, {
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
                              handleItemChange(item.key, {
                                unit: event.target.value,
                              })
                            }
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            推奨: {unitHint}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>ロス率</Label>
                          <Input
                            name={`items.${index}.wasteRate`}
                            type="number"
                            min="0"
                            max="0.99"
                            step="0.001"
                            value={item.wasteRate}
                            onChange={(event) =>
                              handleItemChange(item.key, {
                                wasteRate: Number(event.target.value),
                              })
                            }
                            required
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemove(item.key)}
                            aria-label="行を削除"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "更新中..." : "レシピを更新"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={pending}
              >
                キャンセル
              </Button>
              {hasSubmitted && state.error ? (
                <p className="text-sm text-destructive">{state.error}</p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
