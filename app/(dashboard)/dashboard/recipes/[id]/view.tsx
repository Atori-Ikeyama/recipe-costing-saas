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
import { BarChart } from "@/components/ui/bar-chart";

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
  const portions = cost.portionsPerBatch;
  const totalBatchCost = cost.breakdown.reduce(
    (sum, item) => sum + item.itemCostMinor,
    0
  );
  const totalUnitCost =
    portions && portions > 0 ? totalBatchCost / portions : totalBatchCost;
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
    const perMealCost =
      portions && portions > 0
        ? item.itemCostMinor / portions
        : item.itemCostMinor;
    const percentage =
      totalUnitCost > 0 ? (perMealCost / totalUnitCost) * 100 : 0;

    return {
      ingredientId: item.ingredientId,
      label,
      color,
      value: perMealCost,
      percentage,
    };
  });

  const breakdownMap = new Map(
    breakdown.map((item) => [String(item.ingredientId), item])
  );

  const materialDetails = recipe.items.map((item) => {
    const breakdownItem = cost.breakdown.find(
      (entry) => entry.ingredientId === item.ingredientId
    );
    const ingredient = ingredients.find(
      (entry) => entry.id === item.ingredientId
    );
    const perMealInfo = breakdownMap.get(String(item.ingredientId));
    const perMealCostMinor =
      perMealInfo?.value ??
      (breakdownItem
        ? portions && portions > 0
          ? breakdownItem.itemCostMinor / portions
          : breakdownItem.itemCostMinor
        : undefined);

    return {
      key: `${item.id ?? item.ingredientId}`,
      name: ingredient?.name ?? `材料 #${item.ingredientId}`,
      purchaseUnit: ingredient?.purchaseUnit ?? "不明",
      quantity: item.quantity,
      unit: formatUnit(item.unit),
      perMealCostMinor,
      color: perMealInfo?.color,
      percentage: perMealInfo?.percentage,
      perUnitCostMinor:
        breakdownItem && item.quantity > 0
          ? breakdownItem.itemCostMinor / item.quantity
          : undefined,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {recipe.name}
          </h1>
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

      <CostHighlights
        currencyFormatter={currencyFormatter}
        unitCost={cost.unitCostMinor}
        costRatePercent={costRatePercent}
        sellingPrice={sellingPrice}
      />
      <CostBreakdownCard
        totalUnitCost={totalUnitCost}
        breakdown={breakdown}
        currencyFormatter={currencyFormatter}
        materialDetails={materialDetails}
      />

      <Card className="border-none shadow-none">
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
          <Metric label="提供可能数" value={`${cost.portionsPerBatch} 食`} />
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
  costRatePercent,
  sellingPrice,
}: {
  currencyFormatter: Intl.NumberFormat;
  unitCost: number;
  costRatePercent?: number;
  sellingPrice?: number;
}) {
  const hasSellingPrice = sellingPrice !== undefined && sellingPrice > 0;

  const hasCostRate = hasSellingPrice && costRatePercent !== undefined;
  const formattedCostRate = hasCostRate
    ? `${costRatePercent.toFixed(1)}%`
    : hasSellingPrice
    ? "計算不可"
    : "販売価格未設定";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SummaryCard
        label="原価率"
        value={formattedCostRate}
        helperText={
          hasSellingPrice
            ? "1食原価 ÷ 販売価格で算出"
            : "販売価格を設定すると原価率が算出されます"
        }
        variant="accent"
      />
      <SummaryCard
        label="1食あたり原価"
        value={`¥${currencyFormatter.format(unitCost)}`}
        helperText="材料原価合計 ÷ 提供可能数"
      />
      <SummaryCard
        label="販売価格"
        value={
          hasSellingPrice
            ? `¥${currencyFormatter.format(sellingPrice)}`
            : "未設定"
        }
        helperText={hasSellingPrice ? undefined : "レシピ編集から設定できます"}
      />
    </div>
  );
}

function CostBreakdownCard({
  totalUnitCost,
  breakdown,
  currencyFormatter,
  materialDetails,
}: {
  totalUnitCost: number;
  breakdown: Array<{
    ingredientId: string;
    label: string;
    color: string;
    value: number;
    percentage: number;
  }>;
  currencyFormatter: Intl.NumberFormat;
  materialDetails: Array<{
    key: string;
    name: string;
    purchaseUnit: string;
    quantity: number;
    unit: string;
    perMealCostMinor?: number;
    color?: string;
    percentage?: number;
    perUnitCostMinor?: number;
  }>;
}) {
  const unitCostSeries = materialDetails
    .filter(
      (item) => item.perUnitCostMinor !== undefined && item.perUnitCostMinor > 0
    )
    .sort((a, b) => (b.perUnitCostMinor ?? 0) - (a.perUnitCostMinor ?? 0))
    .map((item) => ({
      label: item.name,
      value: item.perUnitCostMinor ?? 0,
      color: item.color,
      suffix: `/${item.unit}`,
    }));

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>材料別原価内訳</CardTitle>
        <span className="text-sm text-muted-foreground">
          {materialDetails.length} 件
        </span>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          {totalUnitCost > 0 ? (
            <>
              <div className="flex justify-center lg:w-64">
                <DonutChart
                  data={breakdown.map(({ value, color, label }) => ({
                    value,
                    color,
                    label,
                  }))}
                  centerLabel={
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground">
                        一食あたり原価
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        ¥{currencyFormatter.format(totalUnitCost)}
                      </span>
                    </div>
                  }
                />
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <div className="p-4">
                  <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    質量あたり原価
                  </div>
                  <BarChart
                    data={unitCostSeries}
                    valueFormatter={(value) =>
                      `¥${currencyFormatter.format(Math.round(value))}`
                    }
                    emptyLabel="材料ごとの質量あたり原価が算出できませんでした。"
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              原価内訳を計算するための材料コストがありません。
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            材料コスト明細
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>材料</TableHead>
                <TableHead className="text-right">使用量</TableHead>
                <TableHead className="text-right">
                  一食あたり材料コスト
                </TableHead>
                <TableHead className="text-right">構成比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialDetails.map((item) => (
                <TableRow key={item.key}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.color ? (
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                          aria-hidden="true"
                        />
                      ) : null}
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          仕入単位: {item.purchaseUnit}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.perMealCostMinor !== undefined
                      ? `¥${currencyFormatter.format(item.perMealCostMinor)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.percentage !== undefined
                      ? `${item.percentage.toFixed(1)}%`
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  helperText,
  variant = "default",
}: {
  label: string;
  value: string;
  helperText?: string;
  variant?: "default" | "accent";
}) {
  const isAccent = variant === "accent";

  return (
    <Card
      className={
        isAccent
          ? "border-none shadow-none bg-gradient-to-tl from-indigo-400 to-indigo-700 text-white"
          : "border-none shadow-none bg-white"
      }
    >
      <CardHeader
        className={
          isAccent ? "pb-2 text-white/80" : "pb-2 text-muted-foreground"
        }
      >
        <CardTitle
          className={
            isAccent
              ? "text-sm font-medium text-white/90"
              : "text-sm font-medium text-muted-foreground"
          }
        >
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={
            isAccent
              ? "text-2xl font-semibold text-white"
              : "text-2xl font-semibold text-foreground"
          }
        >
          {value}
        </div>
        {helperText ? (
          <p
            className={
              isAccent
                ? "mt-2 text-xs text-white/80"
                : "mt-2 text-xs text-muted-foreground"
            }
          >
            {helperText}
          </p>
        ) : null}
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
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold text-foreground">{value}</div>
      {helperText ? (
        <div className="mt-1 text-[11px] text-muted-foreground/80">
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
