'use client';

import * as React from 'react';
import { FileDown, PlusCircle, Trash2 } from 'lucide-react';

import type { RecipeResponse } from '@/application/recipes/presenter';
import { calculateProcurementAction } from './actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toCsv } from '@/lib/csv';

interface ProcurementDashboardProps {
  recipes: RecipeResponse[];
}

interface PlanItem {
  recipeId: number;
  servings: number;
}

export function ProcurementDashboard({ recipes }: ProcurementDashboardProps) {
  const [items, setItems] = React.useState<PlanItem[]>(
    recipes.length > 0
      ? [{ recipeId: recipes[0]!.id, servings: 10 }]
      : [],
  );
  const [result, setResult] = React.useState<
    Awaited<ReturnType<typeof calculateProcurementAction>> | null
  >(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAdd = React.useCallback(() => {
    if (recipes.length === 0) {
      return;
    }
    setItems((prev) => [...prev, { recipeId: recipes[0]!.id, servings: 10 }]);
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
            : item,
        ),
      );
    },
    [],
  );

  const handleRemove = React.useCallback((index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleCalculate = React.useCallback(async () => {
    if (items.length === 0) {
      setResult(null);
      setError('販売計画が未設定です');
      return;
    }

    setPending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('itemCount', String(items.length));
      items.forEach((item, index) => {
        formData.append(`items.${index}.recipeId`, String(item.recipeId));
        formData.append(`items.${index}.servings`, String(item.servings));
      });

      const calculation = await calculateProcurementAction(formData);
      setResult(calculation);
    } catch (err) {
      console.error(err);
      setError('調達計算に失敗しました');
    } finally {
      setPending(false);
    }
  }, [items]);

  const handleExportCsv = React.useCallback(() => {
    if (!result) {
      return;
    }

    const rows = result.items.map((item) => ({
      ingredientId: item.ingredientId,
      stockUnit: item.stockQuantity.unit.code,
      totalStockQty: item.stockQuantity.value,
      purchaseUnit: item.purchaseQuantity.unit.code,
      purchaseQty: item.purchaseQuantity.value,
      requiredPurchaseUnits: item.requiredPurchaseUnits,
      estimatedAmountMinor: item.estimatedAmountMinor,
    }));

    const csv = toCsv(rows, [
      'ingredientId',
      'stockUnit',
      'totalStockQty',
      'purchaseUnit',
      'purchaseQty',
      'requiredPurchaseUnits',
      'estimatedAmountMinor',
    ]);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `procurement-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">調達計画</h1>
        <p className="text-muted-foreground">
          提供数を入力すると材料ごとの必要量と発注数量を集計します。
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>販売計画入力</CardTitle>
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
            <p className="text-sm text-muted-foreground">
              レシピが未登録のため、先にレシピを作成してください。
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_160px_auto]"
                >
                  <div className="space-y-2">
                    <Label>レシピ</Label>
                    <select
                      value={item.recipeId}
                      onChange={(event) =>
                        handleChange(index, {
                          recipeId: Number(event.target.value),
                        })
                      }
                      className="border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 w-full rounded-md border px-3"
                    >
                      {recipes.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>提供数</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={item.servings}
                      onChange={(event) =>
                        handleChange(index, {
                          servings: Number(event.target.value),
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
                      onClick={() => handleRemove(index)}
                      aria-label="行を削除"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleCalculate}
              disabled={pending || recipes.length === 0}
            >
              {pending ? '計算中...' : '調達量を計算'}
            </Button>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>調達結果</CardTitle>
              <p className="text-sm text-muted-foreground">
                推定発注金額: ¥{result.totalCostMinor.toLocaleString()}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
            >
              <FileDown className="mr-2 size-4" />
              CSVを出力
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>材料ID</TableHead>
                  <TableHead>必要在庫量</TableHead>
                  <TableHead>発注単位あたり</TableHead>
                  <TableHead>必要発注数</TableHead>
                  <TableHead className="text-right">推定金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((item) => (
                  <TableRow key={item.ingredientId}>
                    <TableCell>{item.ingredientId}</TableCell>
                    <TableCell>
                      {item.stockQuantity.value.toFixed(2)}{' '}
                      {item.stockQuantity.unit.code}
                    </TableCell>
                    <TableCell>
                      {item.purchaseQuantity.value.toFixed(2)}{' '}
                      {item.purchaseQuantity.unit.code}
                    </TableCell>
                    <TableCell>{item.requiredPurchaseUnits}</TableCell>
                    <TableCell className="text-right">
                      ¥{item.estimatedAmountMinor.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                在庫量は廃棄率を加味した必要量を表示しています。
              </TableCaption>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
