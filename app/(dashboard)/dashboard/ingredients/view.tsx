'use client';

import * as React from 'react';
import { useActionState } from 'react';
import {
  useReactTable,
  ColumnDef,
  flexRender,
  getCoreRowModel,
} from '@tanstack/react-table';
import { PlusCircle, PencilLine } from 'lucide-react';

import type { IngredientResponse } from '@/application/ingredients/presenter';
import { createIngredientAction, updateIngredientAction } from './actions';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type IngredientActionState = {
  error?: string;
  success?: string;
};

type DashboardMode = 'create' | 'edit';

interface IngredientsDashboardProps {
  initialIngredients: IngredientResponse[];
}

const defaultActionState: IngredientActionState = {};

export function IngredientsDashboard({
  initialIngredients,
}: IngredientsDashboardProps) {
  const [mode, setMode] = React.useState<DashboardMode>(
    initialIngredients.length > 0 ? 'edit' : 'create',
  );
  const [selectedId, setSelectedId] = React.useState<number | null>(
    initialIngredients.length > 0 ? initialIngredients[0]!.id : null,
  );
  const [ingredients, setIngredients] = React.useState(initialIngredients);
  const [createState, createAction, createPending] = useActionState(
    createIngredientAction,
    defaultActionState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateIngredientAction,
    defaultActionState,
  );

  React.useEffect(() => {
    setIngredients(initialIngredients);
    if (initialIngredients.length === 0) {
      setMode('create');
      setSelectedId(null);
      return;
    }

    if (!selectedId || !initialIngredients.some((item) => item.id === selectedId)) {
      setMode('edit');
      setSelectedId(initialIngredients[0]!.id);
    }
  }, [initialIngredients]);

  const columns = React.useMemo<ColumnDef<IngredientResponse>[]>(
    () => [
      {
        accessorKey: 'name',
        header: '材料名',
        cell: ({ row }) => (
          <div className="font-medium text-foreground">{row.original.name}</div>
        ),
      },
      {
        accessorKey: 'purchaseQty',
        header: '仕入単位',
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {row.original.purchaseQty} {row.original.purchaseUnit}
          </div>
        ),
      },
      {
        accessorKey: 'purchasePriceMinor',
        header: '仕入価格',
        cell: ({ row }) => {
          const ingredient = row.original;
          const taxLabel = ingredient.taxIncluded ? '税込' : '税抜';
          return (
            <div className="space-y-1">
              <div className="text-foreground">
                ¥{ingredient.purchasePriceMinor.toLocaleString()}
                <span className="ml-1 text-xs text-muted-foreground">{taxLabel}</span>
              </div>
              {ingredient.taxIncluded ? (
                <div className="text-xs text-muted-foreground">
                  税抜: ¥{ingredient.purchasePriceExclMinor.toLocaleString()}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: 'yieldRatePercent',
        header: '歩留まり',
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {row.original.yieldRatePercent}%
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode('edit');
              setSelectedId(row.original.id);
            }}
          >
            <PencilLine className="size-4" />
            編集
          </Button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: ingredients,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedIngredient = React.useMemo(
    () => ingredients.find((item) => item.id === selectedId) ?? null,
    [ingredients, selectedId],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>材料一覧</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setMode('create');
              setSelectedId(null);
            }}
          >
            <PlusCircle className="size-4" />
            新規追加
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.original.id === selectedId ? 'selected' : undefined}
                    onClick={() => {
                      setMode('edit');
                      setSelectedId(row.original.id);
                    }}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    材料が登録されていません。新規追加から登録してください。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableCaption>材料ごとの歩留まりや価格を一覧で確認できます。</TableCaption>
          </Table>
        </CardContent>
      </Card>
      <aside className="flex flex-col gap-4">
        {mode === 'create' ? (
          <IngredientForm
            key="create"
            title="材料を登録"
            action={createAction}
            state={createState}
            pending={createPending}
            defaultValues={undefined}
            onCancel={() => {
              if (ingredients.length > 0) {
                setMode('edit');
                setSelectedId(ingredients[0]!.id);
              }
            }}
          />
        ) : (
          <IngredientForm
            key={selectedIngredient?.id ?? 'edit'}
            title={selectedIngredient ? `${selectedIngredient.name} を編集` : '材料を編集'}
            action={updateAction}
            state={updateState}
            pending={updatePending}
            defaultValues={selectedIngredient ?? undefined}
            onCancel={() => {
              setMode('create');
              setSelectedId(null);
            }}
          />
        )}
      </aside>
    </div>
  );
}

interface IngredientFormProps {
  title: string;
  action: (
    state: IngredientActionState,
    formData: FormData,
  ) => Promise<IngredientActionState>;
  state: IngredientActionState;
  pending: boolean;
  defaultValues?: IngredientResponse;
  onCancel?: () => void;
}

function IngredientForm({
  title,
  action,
  state,
  pending,
  defaultValues,
  onCancel,
}: IngredientFormProps) {
  return (
    <Card className="sticky top-24 h-fit">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {defaultValues ? (
            <>
              <input type="hidden" name="id" value={defaultValues.id} />
              <input type="hidden" name="version" value={defaultValues.version} />
            </>
          ) : null}
          <Field>
            <Label htmlFor="name">材料名</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaultValues?.name ?? ''}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label htmlFor="purchaseUnit">仕入単位</Label>
              <Input
                id="purchaseUnit"
                name="purchaseUnit"
                placeholder="kg"
                required
                defaultValue={defaultValues?.purchaseUnit ?? ''}
              />
            </Field>
            <Field>
              <Label htmlFor="purchaseQty">仕入数量</Label>
              <Input
                id="purchaseQty"
                name="purchaseQty"
                type="number"
                step="0.001"
                min="0"
                required
                defaultValue={defaultValues?.purchaseQty ?? ''}
              />
            </Field>
          </div>
          <Field>
            <Label htmlFor="purchasePriceMinor">仕入価格 (税込/税抜)</Label>
            <Input
              id="purchasePriceMinor"
              name="purchasePriceMinor"
              type="number"
              min="0"
              required
              defaultValue={defaultValues?.purchasePriceMinor ?? ''}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label htmlFor="taxIncluded">税込表示</Label>
              <select
                id="taxIncluded"
                name="taxIncluded"
                defaultValue={(defaultValues?.taxIncluded ?? true).toString()}
                className="border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex h-9 w-full rounded-md border px-3 py-2"
              >
                <option value="true">税込み</option>
                <option value="false">税抜き</option>
              </select>
            </Field>
            <Field>
              <Label htmlFor="taxRatePercent">税率(%)</Label>
              <Input
                id="taxRatePercent"
                name="taxRatePercent"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={defaultValues?.taxRatePercent ?? 10}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label htmlFor="stockUnit">在庫単位</Label>
              <Input
                id="stockUnit"
                name="stockUnit"
                placeholder="g"
                required
                defaultValue={defaultValues?.stockUnit ?? ''}
              />
            </Field>
            <Field>
              <Label htmlFor="convPurchaseToStock">換算係数</Label>
              <Input
                id="convPurchaseToStock"
                name="convPurchaseToStock"
                type="number"
                step="0.000001"
                min="0"
                required
                defaultValue={defaultValues?.convPurchaseToStock ?? ''}
              />
            </Field>
          </div>
          <Field>
            <Label htmlFor="yieldRatePercent">歩留まり(%)</Label>
            <Input
              id="yieldRatePercent"
              name="yieldRatePercent"
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              required
              defaultValue={defaultValues?.yieldRatePercent ?? 100}
            />
          </Field>
          <Field>
            <Label htmlFor="supplierId">仕入先ID (任意)</Label>
            <Input
              id="supplierId"
              name="supplierId"
              type="number"
              min="1"
              defaultValue={defaultValues?.supplierId ?? ''}
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? '保存中...' : '保存'}
            </Button>
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                キャンセル
              </Button>
            ) : null}
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-emerald-600">{state.success}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
