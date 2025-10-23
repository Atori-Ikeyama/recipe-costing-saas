"use client";

import * as React from "react";
import { FileDown, Loader2, PlusCircle, Trash2 } from "lucide-react";

import type { RecipeResponse } from "@/application/recipes/presenter";
import type { IngredientResponse } from "@/application/ingredients/presenter";
import { calculateProcurementAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DonutChart } from "@/components/ui/donut-chart";
import { BarChart } from "@/components/ui/bar-chart";
import { toCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { convertQuantity, createQuantity, scaleQuantity } from "@/domain/shared/unit";

interface ProcurementDashboardProps {
  recipes: RecipeResponse[];
  ingredients: IngredientResponse[];
}

interface PlanItem {
  recipeId: number;
  servings: number;
}

interface ProcurementTableItem {
  ingredientId: number;
  ingredientName: string;
  stockQuantityValue: number;
  stockUnitCode: string;
  theoreticalPurchaseQuantityValue: number | null;
  roundedPurchaseQuantityValue: number | null;
  purchaseUnitCode: string | null;
  purchaseUnitQtyValue: number | null;
  requiredPurchaseUnits: number;
  estimatedAmountMinor: number;
  supplierName?: string;
  costShare: number;
}

type CalculationState = "idle" | "loading" | "error" | "success";

const chartPalette = [
  "#0EA5E9",
  "#6366F1",
  "#F97316",
  "#22C55E",
  "#EC4899",
  "#14B8A6",
  "#FACC15",
  "#A855F7",
  "#0F172A",
];

export function ProcurementDashboard({
  recipes,
  ingredients,
}: ProcurementDashboardProps) {
  const [items, setItems] = React.useState<PlanItem[]>(
    recipes.length > 0 ? [{ recipeId: recipes[0]!.id, servings: 50 }] : []
  );
  const [result, setResult] = React.useState<Awaited<
    ReturnType<typeof calculateProcurementAction>
  > | null>(null);
  const [status, setStatus] = React.useState<CalculationState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const requestRef = React.useRef(0);

  const recipeMap = React.useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes]
  );
  const ingredientMap = React.useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
    [ingredients]
  );

  const handleAdd = React.useCallback(() => {
    if (recipes.length === 0) {
      return;
    }
    setItems((prev) => [...prev, { recipeId: recipes[0]!.id, servings: 50 }]);
  }, [recipes]);

  const handleChange = React.useCallback(
    (index: number, patch: Partial<PlanItem>) => {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? {
                ...item,
                ...patch,
              }
            : item
        )
      );
    },
    []
  );

  const handleRemove = React.useCallback((index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  React.useEffect(() => {
    if (items.length === 0) {
      setResult(null);
      setStatus("idle");
      setError(null);
      return;
    }

    setStatus("loading");
    setError(null);

    const controller = window.setTimeout(async () => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;

      try {
        const formData = new FormData();
        formData.append("itemCount", String(items.length));
        items.forEach((item, index) => {
          formData.append(`items.${index}.recipeId`, String(item.recipeId));
          formData.append(`items.${index}.servings`, String(item.servings));
        });

        const calculation = await calculateProcurementAction(formData);
        if (requestRef.current === requestId) {
          setResult(calculation);
          setStatus("success");
        }
      } catch (err) {
        console.error(err);
        if (requestRef.current === requestId) {
          setStatus("error");
          setError("調達計算に失敗しました");
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(controller);
    };
  }, [items]);

  const tableItems = React.useMemo<ProcurementTableItem[]>(() => {
    if (!result) {
      return [];
    }

    const totalCost = result.totalCostMinor ?? 0;

    return result.items.map((item) => {
      const ingredient = ingredientMap.get(item.ingredientId);
      const stockUnitCode = ingredient?.stockUnit ?? item.stockUnit ?? "";
      const purchaseUnitCode =
        ingredient?.purchaseUnit ?? item.purchaseUnit ?? null;
      const conversionFactor =
        ingredient?.convPurchaseToStock && ingredient.convPurchaseToStock > 0
          ? ingredient.convPurchaseToStock
          : null;

      const theoreticalPurchaseQuantityValue =
        conversionFactor && conversionFactor > 0
          ? item.totalStockQty / conversionFactor
          : null;

      const purchaseUnitQtyValue =
        ingredient?.purchaseQty ??
        (item.requiredPurchaseUnits > 0
          ? item.purchaseQty / item.requiredPurchaseUnits
          : null);

      const roundedPurchaseQuantityValue =
        purchaseUnitQtyValue !== null
          ? purchaseUnitQtyValue * item.requiredPurchaseUnits
          : item.purchaseQty;

      return {
        ingredientId: item.ingredientId,
        ingredientName: ingredient?.name ?? `材料 ${item.ingredientId}`,
        stockQuantityValue: item.totalStockQty,
        stockUnitCode,
        theoreticalPurchaseQuantityValue,
        roundedPurchaseQuantityValue,
        purchaseUnitCode,
        purchaseUnitQtyValue,
        requiredPurchaseUnits: item.requiredPurchaseUnits,
        estimatedAmountMinor: item.estimatedAmountMinor,
        supplierName: ingredient?.supplierName ?? undefined,
        costShare:
          totalCost > 0
            ? item.estimatedAmountMinor / totalCost
            : 0,
      };
    });
  }, [result, ingredientMap]);

  const totalServings = React.useMemo(
    () => items.reduce((sum, item) => sum + (Number.isFinite(item.servings) ? item.servings : 0), 0),
    [items]
  );

  const totals = React.useMemo(() => {
    const revenue = items.reduce((sum, item, index) => {
      const recipe = recipeMap.get(item.recipeId);
      const price = recipe?.sellingPriceMinor ?? 0;
      const servings = Number.isFinite(item.servings) ? item.servings : 0;
      return sum + price * servings;
    }, 0);

    const cost = result?.totalCostMinor ?? 0;
    const grossProfit = revenue - cost;
    const marginRate = revenue > 0 ? grossProfit / revenue : null;

    return {
      revenue,
      cost,
      grossProfit,
      marginRate,
    };
  }, [items, recipeMap, result]);

  const planSummaryByRecipe = React.useMemo(() => {
    const purchases = new Map<number, number>();
    ingredients.forEach((ingredient) => {
      const factor =
        Number.isFinite(ingredient.convPurchaseToStock) && ingredient.convPurchaseToStock > 0
          ? ingredient.convPurchaseToStock
          : 1;
      const stockQty = ingredient.purchaseQty * factor;
      purchases.set(ingredient.id, stockQty);
    });

    const computeServingsPerBatch = (recipe: RecipeResponse): number => {
      if (
        !Number.isFinite(recipe.batchOutputQty) ||
        recipe.batchOutputQty <= 0 ||
        !Number.isFinite(recipe.servingSizeQty) ||
        recipe.servingSizeQty <= 0
      ) {
        return NaN;
      }

      try {
        const batch = createQuantity(recipe.batchOutputQty, recipe.batchOutputUnit);
        const yieldFactor = Math.max(recipe.platingYieldRatePercent ?? 100, 0) / 100;
        const effectiveBatch = scaleQuantity(batch, yieldFactor);
        const serving = createQuantity(recipe.servingSizeQty, recipe.servingSizeUnit);
        const servingInBatchUnit = convertQuantity(serving, effectiveBatch.unit);
        if (!Number.isFinite(servingInBatchUnit.value) || servingInBatchUnit.value <= 0) {
          return NaN;
        }
        if (!Number.isFinite(effectiveBatch.value) || effectiveBatch.value <= 0) {
          return NaN;
        }
        return effectiveBatch.value / servingInBatchUnit.value;
      } catch (error) {
        console.warn("Failed to compute servings per batch", { recipe, error });
        return NaN;
      }
    };

    const computeItemStockQuantity = (
      recipeItem: RecipeResponse["items"][number],
      ingredient: IngredientResponse
    ): number | null => {
      if (!Number.isFinite(recipeItem.quantity) || recipeItem.quantity <= 0) {
        return 0;
      }

      const wasteRate = Number.isFinite(recipeItem.wasteRate) ? recipeItem.wasteRate : 0;
      const safeWasteRate = Math.min(Math.max(wasteRate, 0), 0.99);
      const divisor = 1 - safeWasteRate;
      if (divisor <= 0) {
        return null;
      }

      if (recipeItem.unit === ingredient.stockUnit) {
        return recipeItem.quantity / divisor;
      }

      try {
        const quantity = createQuantity(recipeItem.quantity, recipeItem.unit);
        const converted = convertQuantity(quantity, ingredient.stockUnit);
        return converted.value / divisor;
      } catch (error) {
        console.warn("Failed to convert recipe item quantity", {
          recipeItem,
          ingredient,
          error,
        });
        return null;
      }
    };

    const summary = new Map<
      number,
      {
        recipeId: number;
        label: string;
        servings: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    >();

    items.forEach((item) => {
      const recipe = recipeMap.get(item.recipeId);
      if (!recipe) {
        return;
      }

      const servings = Number.isFinite(item.servings) ? item.servings : 0;
      const price = recipe.sellingPriceMinor ?? 0;

      const entry = summary.get(recipe.id) ?? {
        recipeId: recipe.id,
        label: recipe.name,
        servings: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      };

      entry.servings += servings;
      entry.revenue += price * servings;

      if (servings > 0) {
        const portionCount = computeServingsPerBatch(recipe);
        if (Number.isFinite(portionCount) && portionCount > 0) {
          const batchMultiplier = servings / portionCount;
          recipe.items.forEach((recipeItem) => {
            const ingredient = ingredientMap.get(recipeItem.ingredientId);
            if (!ingredient) {
              return;
            }
            const stockQty = computeItemStockQuantity(recipeItem, ingredient);
            if (stockQty === null || stockQty <= 0) {
              return;
            }
            const purchaseStockQty = purchases.get(ingredient.id);
            const purchasePrice = ingredient.purchasePriceMinor ?? 0;
            if (!purchaseStockQty || purchaseStockQty <= 0 || !Number.isFinite(purchasePrice)) {
              return;
            }
            const totalStockQty = stockQty * batchMultiplier;
            entry.cost += (totalStockQty / purchaseStockQty) * purchasePrice;
          });
        }
      }

      entry.profit = entry.revenue - entry.cost;
      summary.set(recipe.id, entry);
    });

    const entries = Array.from(summary.values()).sort((a, b) => b.revenue - a.revenue);
    return entries.map((entry, index) => ({
      ...entry,
      color: chartPalette[index % chartPalette.length],
    }));
  }, [ingredientMap, ingredients, items, recipeMap]);

  const revenueDonutData = React.useMemo(
    () =>
      planSummaryByRecipe
        .filter((item) => item.revenue > 0)
        .map((item) => ({
          label: item.label,
          value: item.revenue,
          color: item.color,
          suffix: "円",
        })),
    [planSummaryByRecipe]
  );

  const profitDonutData = React.useMemo(
    () =>
      planSummaryByRecipe
        .filter((item) => item.profit > 0)
        .map((item) => ({
          label: item.label,
          value: item.profit,
          color: item.color,
          suffix: "円",
        })),
    [planSummaryByRecipe]
  );

  const servingsDonutData = React.useMemo(
    () =>
      planSummaryByRecipe
        .filter((item) => item.servings > 0)
        .map((item) => ({
          label: item.label,
          value: item.servings,
          color: item.color,
          suffix: "食",
        })),
    [planSummaryByRecipe]
  );

  const hasNegativeProfit = React.useMemo(
    () => planSummaryByRecipe.some((item) => item.profit < 0),
    [planSummaryByRecipe]
  );

  const totalProfit = React.useMemo(
    () => planSummaryByRecipe.reduce((sum, item) => sum + item.profit, 0),
    [planSummaryByRecipe]
  );

  const handleExportCsv = React.useCallback(() => {
    if (tableItems.length === 0) {
      return;
    }

    const rows = tableItems.map((item) => ({
      ingredientId: item.ingredientId,
      ingredientName: item.ingredientName,
      stockUnit: item.stockUnitCode,
      totalStockQty: item.stockQuantityValue,
      purchaseUnit: item.purchaseUnitCode ?? "",
      theoreticalPurchaseQty: item.theoreticalPurchaseQuantityValue ?? "",
      roundedPurchaseQty: item.roundedPurchaseQuantityValue ?? "",
      requiredPurchaseUnits: item.requiredPurchaseUnits,
      estimatedAmountMinor: item.estimatedAmountMinor,
      supplierName: item.supplierName ?? "",
      costShare: item.costShare,
    }));

    const csv = toCsv(rows, [
      "ingredientId",
      "ingredientName",
      "stockUnit",
      "totalStockQty",
      "theoreticalPurchaseQty",
      "purchaseUnit",
      "roundedPurchaseQty",
      "requiredPurchaseUnits",
      "estimatedAmountMinor",
      "supplierName",
      "costShare",
    ]);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `procurement-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [tableItems]);

  const formatQuantity = React.useCallback(
    (value: number) =>
      new Intl.NumberFormat("ja-JP", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value),
    []
  );

  const currencyFormatter = React.useMemo(
    () => new Intl.NumberFormat("ja-JP"),
    []
  );

  const formatCurrency = React.useCallback(
    (value: number) => {
      const rounded = Math.round(value);
      const sign = rounded < 0 ? "-" : "";
      return `${sign}¥${currencyFormatter.format(Math.abs(rounded))}`;
    },
    [currencyFormatter]
  );

  const formatPercentage = React.useCallback((value: number | null) => {
    if (value === null || Number.isNaN(value)) {
      return "―";
    }
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  const hasPlan = items.length > 0 && totalServings > 0;

  const procurementChartData = React.useMemo(
    () =>
      tableItems
        .slice()
        .sort((a, b) => b.estimatedAmountMinor - a.estimatedAmountMinor)
        .map((item, index) => ({
          label: item.ingredientName,
          value: item.estimatedAmountMinor,
          color: chartPalette[index % chartPalette.length],
          suffix: "円",
        })),
    [tableItems]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary/80">販売計画ダッシュボード</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          メニュー構成で売上と限界利益をシミュレーション
        </h1>
        <p className="text-sm text-muted-foreground">
          レシピと提供数を入力すると、推定売上・原価・限界利益率がリアルタイムで更新されます。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="推定売上"
          value={formatCurrency(totals.revenue)}
          helper="提供数 × レシピ販売価格"
          loading={status === "loading" && hasPlan}
        />
        <MetricCard
          label="推定原価"
          value={formatCurrency(totals.cost)}
          helper="必要材料の仕入合計"
          loading={status === "loading" && hasPlan}
        />
        <MetricCard
          label="限界利益"
          value={formatCurrency(totals.grossProfit)}
          helper="売上 − 原価"
          trend={totals.grossProfit >= 0 ? "positive" : "negative"}
          loading={status === "loading" && hasPlan}
        />
        <MetricCard
          label="限界利益率"
          value={formatPercentage(totals.marginRate)}
          helper="利益 ÷ 売上"
          trend={
            totals.marginRate !== null && totals.marginRate >= 0.6
              ? "positive"
              : totals.marginRate !== null && totals.marginRate < 0.4
              ? "negative"
              : undefined
          }
          loading={status === "loading" && hasPlan}
        />
      </section>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>販売構成</CardTitle>
          <p className="text-sm text-muted-foreground">
            売上・利益・提供数の比率を俯瞰して、主力メニューを把握しましょう。
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            <CompositionDonut
              title="売上構成比"
              data={revenueDonutData}
              totalLabel={formatCurrency(totals.revenue)}
              emptyLabel="売上データが追加されると構成比が表示されます。"
            />
            <CompositionDonut
              title="利益構成比"
              data={profitDonutData}
              totalLabel={formatCurrency(totalProfit)}
              emptyLabel="利益が発生すると構成比が表示されます。"
              legendFooter={
                hasNegativeProfit ? "赤字のレシピは構成比に含まれていません。" : undefined
              }
            />
            <CompositionDonut
              title="食数構成比"
              data={servingsDonutData}
              totalLabel={`${formatQuantity(totalServings)} 食`}
              emptyLabel="提供数が設定されると構成比が表示されます。"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>メニュー構成</CardTitle>
              <p className="text-sm text-muted-foreground">
                提供数を調整すると右側のサマリーとグラフが即時に更新されます。
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              disabled={recipes.length === 0}
            >
              <PlusCircle className="mr-2 size-4" />
              行を追加
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recipes.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
                レシピが未登録のため、先にレシピを作成してください。
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
                メニュー構成を始めるには「行を追加」からレシピを選択してください。
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>レシピ</TableHead>
                    <TableHead className="w-32 text-right">提供数</TableHead>
                    <TableHead className="w-32 text-right">小計</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const recipe = recipeMap.get(item.recipeId);
                    const price = recipe?.sellingPriceMinor ?? 0;
                    const subtotal =
                      price * (Number.isFinite(item.servings) ? item.servings : 0);

                    return (
                      <TableRow key={`${index}-${item.recipeId}`} className="align-top">
                        <TableCell className="space-y-1">
                          <select
                            aria-label={`プラン${index + 1}のレシピ`}
                            value={item.recipeId}
                            onChange={(event) =>
                              handleChange(index, {
                                recipeId: Number(event.target.value),
                              })
                            }
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {recipes.map((recipeOption) => (
                              <option key={recipeOption.id} value={recipeOption.id}>
                                {recipeOption.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-muted-foreground">
                            {price > 0
                              ? `販売価格 ${formatCurrency(price)}`
                              : "販売価格が設定されていません"}
                          </p>
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            aria-label={`${recipe?.name ?? "レシピ"}の提供数`}
                            className="h-10"
                            inputMode="numeric"
                            min="0"
                            step="1"
                            type="number"
                            value={Number.isFinite(item.servings) ? item.servings : ""}
                            onChange={(event) =>
                              handleChange(index, {
                                servings: Number(event.target.value),
                              })
                            }
                            required
                          />
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <div className="font-medium tabular-nums">
                            {formatCurrency(subtotal)}
                          </div>
                          <div className="text-xs text-muted-foreground">小計</div>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(index)}
                            aria-label="行を削除"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>調達コスト内訳</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={procurementChartData}
                valueFormatter={(value) => `${Math.round(value).toLocaleString()} 円`}
                emptyLabel="調達計算の結果が表示されるとコストの内訳が確認できます。"
              />
            </CardContent>
          </Card>
          {status === "loading" && hasPlan ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              計算中です...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>仕入調達</CardTitle>
            <p className="text-sm text-muted-foreground">
              推定原価の内訳と仕入単位を確認できます。
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={tableItems.length === 0}
          >
            <FileDown className="mr-2 size-4" />
            CSVを出力
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption className="text-left">
              {tableItems.length === 0
                ? "提供数を入力すると材料ごとの必要量と仕入情報が表示されます。"
                : "推定金額は仕入単位ごとの切り上げを反映しています。"}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>材料</TableHead>
                <TableHead>必要在庫量</TableHead>
                <TableHead>発注総量</TableHead>
                <TableHead>発注単位数</TableHead>
                <TableHead className="text-right">推定金額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableItems.map((item, index) => {
                const ingredient = ingredientMap.get(item.ingredientId);
                const purchasePerUnit =
                  item.purchaseUnitQtyValue !== null && item.purchaseUnitCode
                    ? `${formatQuantity(item.purchaseUnitQtyValue)} ${item.purchaseUnitCode}`
                    : item.purchaseUnitCode
                    ? `${item.purchaseUnitCode} 単位`
                    : null;
                const showRoundedAdjustment =
                  item.theoreticalPurchaseQuantityValue !== null &&
                  item.roundedPurchaseQuantityValue !== null &&
                  Math.abs(
                    item.roundedPurchaseQuantityValue - item.theoreticalPurchaseQuantityValue
                  ) > 1e-6;

                return (
                  <TableRow key={`ingredient-${item.ingredientId}-${index}`}>
                    <TableCell>
                      <div className="font-medium">
                        {ingredient?.name ?? item.ingredientName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {purchasePerUnit ? `仕入単位: ${purchasePerUnit}` : "仕入単位情報なし"}
                      </div>
                      {item.supplierName ? (
                        <div className="text-xs text-muted-foreground">
                          仕入先: {item.supplierName}
                        </div>
                      ) : null}
                      <div className="text-xs text-muted-foreground">
                        コスト寄与度: {formatPercentage(item.costShare)}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatQuantity(item.stockQuantityValue)} {item.stockUnitCode}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {item.theoreticalPurchaseQuantityValue !== null && item.purchaseUnitCode ? (
                        <>
                          {formatQuantity(item.theoreticalPurchaseQuantityValue)}{" "}
                          {item.purchaseUnitCode}
                          {showRoundedAdjustment ? (
                            <div className="text-xs text-muted-foreground">
                              切上後:{" "}
                              {formatQuantity(item.roundedPurchaseQuantityValue ?? 0)}{" "}
                              {item.purchaseUnitCode}
                            </div>
                          ) : null}
                        </>
                      ) : item.roundedPurchaseQuantityValue !== null && item.purchaseUnitCode ? (
                        <>
                          {formatQuantity(item.roundedPurchaseQuantityValue)} {item.purchaseUnitCode}
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{item.requiredPurchaseUnits}</TableCell>
                    <TableCell className="tabular-nums text-right">
                      {formatCurrency(item.estimatedAmountMinor)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {tableItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    調達計算の結果がここに表示されます。
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface CompositionDonutDatum {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}

interface CompositionDonutProps {
  title: string;
  data: CompositionDonutDatum[];
  totalLabel: string;
  emptyLabel: string;
  legendFooter?: string;
}

function CompositionDonut({
  title,
  data,
  totalLabel,
  emptyLabel,
  legendFooter,
}: CompositionDonutProps) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  if (totalValue <= 0 || data.length === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border/60 p-4">
        <div className="text-sm font-semibold text-muted-foreground">{title}</div>
        <div className="text-base font-semibold tabular-nums">{totalLabel}</div>
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        {legendFooter ? (
          <p className="text-xs text-muted-foreground">{legendFooter}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border/60 p-4">
      <div className="text-sm font-semibold text-muted-foreground">{title}</div>
      <div className="flex flex-col items-center gap-4">
        <DonutChart
          data={data.map((item) => ({
            label: item.label,
            value: item.value,
            color: item.color,
            suffix: item.suffix,
          }))}
          size={160}
          centerLabel={
            <div className="text-center">
              <div className="text-xs text-muted-foreground">{title}</div>
              <div className="text-base font-semibold tabular-nums">{totalLabel}</div>
            </div>
          }
        />
        <div className="w-full space-y-2 text-sm">
          {data.map((item) => {
            const ratio =
              totalValue > 0 ? Math.round((item.value / totalValue) * 1000) / 10 : 0;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="tabular-nums text-muted-foreground">{ratio}%</span>
              </div>
            );
          })}
          {legendFooter ? (
            <p className="text-xs text-muted-foreground">{legendFooter}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
  trend?: "positive" | "negative";
  loading?: boolean;
}

function MetricCard({ label, value, helper, trend, loading }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/95 p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={cn("text-2xl font-semibold", trend === "negative" && "text-destructive")}>
          {value}
        </span>
        {loading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>
      {helper ? (
        <div className="mt-2 text-xs text-muted-foreground">{helper}</div>
      ) : null}
    </div>
  );
}
