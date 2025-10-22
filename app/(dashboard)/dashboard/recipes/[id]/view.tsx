"use client";

import Link from "next/link";

import type { IngredientResponse } from "@/application/ingredients/presenter";
import type { RecipeResponse } from "@/application/recipes/presenter";
import type { RecipeCostResult } from "@/domain/costing/costing-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { DonutChart } from "@/components/ui/donut-chart";

const formatUnit = (unit: string) => (unit === "meal" ? "食" : unit);

interface RecipeDetailViewProps {
  recipe: RecipeResponse;
  ingredients: IngredientResponse[];
  cost: RecipeCostResult;
}

export function RecipeDetailView({
  recipe,
  ingredients,
  cost,
}: RecipeDetailViewProps) {
  const currencyFormatter = new Intl.NumberFormat("ja-JP");
  const totalCost = cost.breakdown.reduce(
    (sum, item) => sum + item.itemCostMinor,
    0
  );
  const sellingPrice = recipe.sellingPriceMinor;
  const costRatePercent =
    sellingPrice && sellingPrice > 0
      ? (cost.unitCostMinor / sellingPrice) * 100
      : undefined;

  const palette = [
    "#0EA5E9",
    "#6366F1",
    "#F97316",
    "#22C55E",
    "#EC4899",
    "#14B8A6",
    "#FACC15",
  ];

  const breakdown = cost.breakdown.map((item, index) => {
    const ingredient = ingredients.find(
      (entry) => entry.id === item.ingredientId
    );
    const label = ingredient?.name ?? `材料 ${item.ingredientId}`;
    const color = palette[index % palette.length];
    const percentage =
      totalCost > 0 ? (item.itemCostMinor / totalCost) * 100 : 0;

    return {
      label,
      color,
      value: item.itemCostMinor,
      percentage,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{recipe.name}</h1>
          <p className="text-sm text-muted-foreground">
            原価指標と材料内訳を確認できます。内容を変更する場合は編集画面をご利用ください。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/recipes">一覧へ戻る</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/recipes/${recipe.id}/edit`}>編集</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CostHighlights
          currencyFormatter={currencyFormatter}
          unitCost={cost.unitCostMinor}
          batchCost={cost.batchCostMinor}
          portions={cost.portionsPerBatch}
          costRatePercent={costRatePercent}
          hasSellingPrice={Boolean(sellingPrice)}
        />
        <CostBreakdownCard
          totalCost={totalCost}
          breakdown={breakdown}
          currencyFormatter={currencyFormatter}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>材料コスト明細</CardTitle>
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
                <TableHead className="text-right">材料コスト</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipe.items.map((item) => {
                const breakdownItem = cost.breakdown.find(
                  (entry) => entry.ingredientId === item.ingredientId
                );
                const ingredient = ingredients.find(
                  (entry) => entry.id === item.ingredientId
                );

                return (
                  <TableRow key={item.id ?? item.ingredientId}>
                    <TableCell>
                      <div className="font-medium">
                        {ingredient?.name ?? `材料 #${item.ingredientId}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        仕入単位: {ingredient?.purchaseUnit ?? "不明"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {formatUnit(item.unit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {breakdownItem
                        ? `¥${currencyFormatter.format(
                            breakdownItem.itemCostMinor
                          )}`
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableCaption>
              材料の変更は編集画面から行ってください。
            </TableCaption>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>レシピ情報</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="仕上がり食数"
            value={`${recipe.batchOutputQty} ${formatUnit(
              recipe.batchOutputUnit
            )}`}
          />
          <Metric
            label="提供可能数"
            value={`${cost.portionsPerBatch} 食`}
          />
          <Metric
            label="盛付歩留まり"
            value={`${recipe.platingYieldRatePercent ?? 100}%`}
          />
          <Metric label="バージョン" value={`v${recipe.version}`} />
          <Metric
            label="販売価格"
            value={
              recipe.sellingPriceMinor !== undefined
                ? `¥${currencyFormatter.format(recipe.sellingPriceMinor)}`
                : "未設定"
            }
          />
          <Metric
            label="税区分"
            value={
              recipe.sellingPriceTaxIncluded !== undefined
                ? recipe.sellingPriceTaxIncluded
                  ? "税込"
                  : "税抜"
                : "未設定"
            }
            helperText={
              recipe.sellingTaxRatePercent !== undefined
                ? `${recipe.sellingTaxRatePercent}%`
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function CostHighlights({
  currencyFormatter,
  unitCost,
  batchCost,
  portions,
  costRatePercent,
  hasSellingPrice,
}: {
  currencyFormatter: Intl.NumberFormat;
  unitCost: number;
  batchCost: number;
  portions: number;
  costRatePercent?: number;
  hasSellingPrice: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>原価サマリー</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="1提供あたり原価"
          value={`¥${currencyFormatter.format(unitCost)}`}
        />
        <Metric
          label="バッチ原価"
          value={`¥${currencyFormatter.format(batchCost)}`}
        />
        <Metric
          label="提供可能数"
          value={`${portions} 食`}
        />
        <Metric
          label="原価率"
          value={
            costRatePercent !== undefined
              ? `${costRatePercent.toFixed(1)}%`
              : "販売価格未設定"
          }
          helperText={
            hasSellingPrice
              ? "1食原価 ÷ 販売価格で算出"
              : undefined
          }
        />
      </CardContent>
    </Card>
  );
}

function CostBreakdownCard({
  totalCost,
  breakdown,
  currencyFormatter,
}: {
  totalCost: number;
  breakdown: Array<{
    label: string;
    color: string;
    value: number;
    percentage: number;
  }>;
  currencyFormatter: Intl.NumberFormat;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>材料別原価内訳</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {totalCost > 0 ? (
          <>
            <DonutChart
              data={breakdown.map(({ value, color, label }) => ({
                value,
                color,
                label,
              }))}
              centerLabel={
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground">
                    バッチ原価
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    ¥{currencyFormatter.format(totalCost)}
                  </span>
                </div>
              }
            />
            <ul className="w-full space-y-2 text-sm">
              {breakdown.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <div>¥{currencyFormatter.format(item.value)}</div>
                    <div className="text-xs">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            原価内訳を計算するための材料コストがありません。
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  helperText,
}: {
  label: string;
  value: string;
  helperText?: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold text-foreground">{value}</div>
      {helperText ? (
        <div className="text-[11px] text-muted-foreground/80 mt-1">
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
