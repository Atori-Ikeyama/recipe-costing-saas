"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useActionState } from "react";
import {
  useReactTable,
  ColumnDef,
  flexRender,
  getCoreRowModel,
} from "@tanstack/react-table";
import { PlusCircle, PencilLine, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { IngredientResponse } from "@/application/ingredients/presenter";
import {
  createIngredientAction,
  updateIngredientAction,
  deleteIngredientAction,
} from "./actions";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IngredientActionState = {
  error?: string;
  success?: string;
};

interface IngredientsDashboardProps {
  initialIngredients: IngredientResponse[];
  initialQuery: string;
}

const defaultActionState: IngredientActionState = {};
const DEFAULT_STOCK_UNIT = "g";
const purchaseUnitOptions = [
  { value: "g", label: "グラム (g)", conversionToStock: 1 },
  { value: "kg", label: "キログラム (kg)", conversionToStock: 1000 },
  { value: "mg", label: "ミリグラム (mg)", conversionToStock: 0.001 },
  { value: "ml", label: "ミリリットル (ml)", conversionToStock: 1 },
  { value: "l", label: "リットル (l)", conversionToStock: 1000 },
  { value: "ea", label: "個数 (ea)", conversionToStock: 1 },
];
const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

type FormMode =
  | {
      mode: "create";
      ingredient: null;
    }
  | {
      mode: "edit";
      ingredient: IngredientResponse;
    }
  | {
      mode: "delete";
      ingredient: IngredientResponse;
    };

export function IngredientsDashboard({
  initialIngredients,
  initialQuery,
}: IngredientsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSearching, startTransition] = React.useTransition();
  const [searchValue, setSearchValue] = React.useState(initialQuery);
  const trimmedInitialQuery = React.useMemo(
    () => initialQuery.trim(),
    [initialQuery]
  );
  const searchParamsSnapshot = React.useMemo(
    () => searchParams.toString(),
    [searchParams]
  );
  const canReset =
    trimmedInitialQuery.length > 0 || searchValue.trim().length > 0;
  const canSubmit =
    searchValue.trim().length > 0 || trimmedInitialQuery.length > 0;

  const [selectedId, setSelectedId] = React.useState<number | null>(
    initialIngredients.length > 0 ? initialIngredients[0]!.id : null
  );
  const [ingredients, setIngredients] = React.useState(initialIngredients);
  const [createState, createAction, createPending] = useActionState(
    createIngredientAction,
    defaultActionState
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateIngredientAction,
    defaultActionState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteIngredientAction,
    defaultActionState
  );
  const [formState, setFormState] = React.useState<FormMode | null>(null);
  const isModalOpen = formState !== null;

  React.useEffect(() => {
    setSearchValue(initialQuery);
  }, [initialQuery]);

  const applySearchParam = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParamsSnapshot);
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      const next = params.toString();
      startTransition(() => {
        router.replace(next ? `${pathname}?${next}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParamsSnapshot, startTransition]
  );

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextValue = searchValue.trim();
      if (nextValue === trimmedInitialQuery) {
        return;
      }
      applySearchParam(nextValue);
    },
    [applySearchParam, searchValue, trimmedInitialQuery]
  );

  const handleReset = React.useCallback(() => {
    const hasQuery = trimmedInitialQuery.length > 0;
    if (!hasQuery) {
      if (searchValue.length > 0) {
        setSearchValue("");
      }
      return;
    }
    setSearchValue("");
    applySearchParam("");
  }, [applySearchParam, searchValue, trimmedInitialQuery]);

  React.useEffect(() => {
    setIngredients(initialIngredients);
  }, [initialIngredients]);

  React.useEffect(() => {
    if (formState?.mode !== "edit") {
      return;
    }

    const updated = initialIngredients.find(
      (item) => item.id === formState.ingredient.id
    );
    if (updated && updated.version !== formState.ingredient.version) {
      setFormState({ mode: "edit", ingredient: updated });
    }
  }, [initialIngredients, formState]);

  React.useEffect(() => {
    if (initialIngredients.length === 0) {
      if (selectedId !== null) {
        setSelectedId(null);
      }
      if (formState?.mode === "edit") {
        setFormState(null);
      }
      return;
    }

    if (
      !selectedId ||
      !initialIngredients.some((item) => item.id === selectedId)
    ) {
      setSelectedId(initialIngredients[0]!.id);
    }
  }, [initialIngredients, selectedId, formState]);

  const openCreateModal = React.useCallback(() => {
    setFormState({ mode: "create", ingredient: null });
  }, []);

  const openEditModal = React.useCallback((ingredient: IngredientResponse) => {
    setSelectedId(ingredient.id);
    setFormState({ mode: "edit", ingredient });
  }, []);

  const openDeleteModal = React.useCallback(
    (ingredient: IngredientResponse) => {
      setSelectedId(ingredient.id);
      setFormState({ mode: "delete", ingredient });
    },
    []
  );

  const closeModal = React.useCallback(() => {
    setFormState(null);
  }, []);

  const modalContent = React.useMemo(() => {
    if (!formState) {
      return null;
    }

    if (formState.mode === "create") {
      return {
        type: "form" as const,
        props: {
          key: "create",
          title: "材料を登録",
          action: createAction,
          state: createState,
          pending: createPending,
          defaultValues: undefined,
        },
      };
    }

    if (formState.mode === "edit") {
      return {
        type: "form" as const,
        props: {
          key: formState.ingredient.id,
          title: `${formState.ingredient.name} を編集`,
          action: updateAction,
          state: updateState,
          pending: updatePending,
          defaultValues: formState.ingredient,
        },
      };
    }

    return {
      type: "delete" as const,
      props: {
        ingredient: formState.ingredient,
        action: deleteAction,
        state: deleteState,
        pending: deletePending,
      },
    };
  }, [
    formState,
    createAction,
    createState,
    createPending,
    updateAction,
    updateState,
    updatePending,
    deleteAction,
    deleteState,
    deletePending,
  ]);

  const columns = React.useMemo<ColumnDef<IngredientResponse>[]>(
    () => [
      {
        accessorKey: "name",
        header: "材料名",
        cell: ({ row }) => (
          <div className="font-medium text-foreground">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "purchaseQty",
        header: "仕入単位",
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {row.original.purchaseQty} {row.original.purchaseUnit}
          </div>
        ),
      },
      {
        accessorKey: "purchasePriceMinor",
        header: "仕入価格",
        cell: ({ row }) => (
          <div className="text-foreground">
            ¥{row.original.purchasePriceMinor.toLocaleString()} (税込)
          </div>
        ),
      },
      {
        accessorKey: "yieldRatePercent",
        header: "歩留まり",
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {row.original.yieldRatePercent}%
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                openEditModal(row.original);
              }}
              aria-label="材料を編集"
              title="編集"
            >
              <PencilLine className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                openDeleteModal(row.original);
              }}
              aria-label="材料を削除"
              title="削除"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [openEditModal, openDeleteModal]
  );

  const table = useReactTable({
    data: ingredients,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <CardTitle className="shrink-0">材料一覧</CardTitle>
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:max-w-lg"
            >
              <Input
                name="q"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="材料名で検索"
                className="h-9 sm:flex-1"
                autoComplete="off"
                aria-label="材料名で検索"
              />
              <div className="flex gap-2 sm:w-auto">
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={!canSubmit || isSearching}
                >
                  {isSearching ? "検索中…" : "検索"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={!canReset}
                >
                  クリア
                </Button>
              </div>
            </form>
          </div>
          <Button size="sm" onClick={openCreateModal}>
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
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                    data-state={
                      row.original.id === selectedId ? "selected" : undefined
                    }
                    onClick={() => {
                      setSelectedId(row.original.id);
                    }}
                    className="cursor-default"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    材料が登録されていません。新規追加から登録してください。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <IngredientModal open={isModalOpen} onClose={closeModal}>
        {modalContent?.type === "form" ? (
          <IngredientForm
            key={modalContent.props.key}
            title={modalContent.props.title}
            action={modalContent.props.action}
            state={modalContent.props.state}
            pending={modalContent.props.pending}
            defaultValues={modalContent.props.defaultValues}
            onCancel={closeModal}
          />
        ) : null}
        {modalContent?.type === "delete" ? (
          <DeleteIngredientConfirm
            key={`delete-${modalContent.props.ingredient.id}`}
            ingredient={modalContent.props.ingredient}
            action={modalContent.props.action}
            state={modalContent.props.state}
            pending={modalContent.props.pending}
            onCancel={closeModal}
            onSuccess={() => {
              const targetId = modalContent.props.ingredient.id;
              setSelectedId((current) =>
                current === targetId ? null : current
              );
            }}
          />
        ) : null}
      </IngredientModal>
    </div>
  );
}

interface IngredientFormProps {
  title: string;
  action: (
    state: IngredientActionState,
    formData: FormData
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
  const initialUnit = defaultValues?.purchaseUnit ?? DEFAULT_STOCK_UNIT;
  const fallbackOption =
    purchaseUnitOptions.find((option) => option.value === initialUnit) ??
    purchaseUnitOptions[0];
  const initialConversion = defaultValues
    ? String(defaultValues.convPurchaseToStock)
    : String(fallbackOption?.conversionToStock ?? 1);

  const [purchaseUnit, setPurchaseUnit] = React.useState(initialUnit);
  const [conversion, setConversion] = React.useState(initialConversion);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (hasSubmitted && state.success && onCancel) {
      onCancel();
    }
  }, [hasSubmitted, state.success, onCancel]);

  React.useEffect(() => {
    const nextUnit = defaultValues?.purchaseUnit ?? DEFAULT_STOCK_UNIT;
    setPurchaseUnit(nextUnit);
    if (defaultValues?.convPurchaseToStock !== undefined) {
      setConversion(String(defaultValues.convPurchaseToStock));
      return;
    }
    const option =
      purchaseUnitOptions.find((item) => item.value === nextUnit) ??
      purchaseUnitOptions[0];
    setConversion(option ? option.conversionToStock.toString() : "1");
  }, [defaultValues]);

  const handlePurchaseUnitChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextUnit = event.target.value;
    setPurchaseUnit(nextUnit);
    const option = purchaseUnitOptions.find((item) => item.value === nextUnit);
    setConversion(option ? option.conversionToStock.toString() : "1");
  };

  return (
    <Card className="sticky top-24 h-fit">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          className="space-y-4"
          onSubmit={() => {
            setHasSubmitted(true);
          }}
        >
          {defaultValues ? (
            <>
              <input type="hidden" name="id" value={defaultValues.id} />
              <input
                type="hidden"
                name="version"
                value={defaultValues.version}
              />
            </>
          ) : null}
          <Field>
            <Label htmlFor="name">材料名</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaultValues?.name ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label htmlFor="purchaseUnit">仕入単位</Label>
              <select
                id="purchaseUnit"
                name="purchaseUnit"
                required
                value={purchaseUnit}
                onChange={handlePurchaseUnitChange}
                className={selectClassName}
              >
                <option value="" disabled>
                  単位を選択
                </option>
                {purchaseUnitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                defaultValue={defaultValues?.purchaseQty ?? ""}
              />
            </Field>
          </div>
          <Field>
            <Label htmlFor="purchasePriceMinor">仕入価格 (税込)</Label>
            <Input
              id="purchasePriceMinor"
              name="purchasePriceMinor"
              type="number"
              min="0"
              required
              defaultValue={defaultValues?.purchasePriceMinor ?? ""}
            />
          </Field>
          <input type="hidden" name="convPurchaseToStock" value={conversion} />
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
          <input type="hidden" name="stockUnit" value={DEFAULT_STOCK_UNIT} />
          <input
            type="hidden"
            name="supplierId"
            value={defaultValues?.supplierId ?? ""}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "保存中..." : "保存"}
            </Button>
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                キャンセル
              </Button>
            ) : null}
          </div>
          {hasSubmitted && state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {hasSubmitted && state.success ? (
            <p className="text-sm text-emerald-600">{state.success}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteIngredientConfirm({
  ingredient,
  action,
  state,
  pending,
  onCancel,
  onSuccess,
}: {
  ingredient: IngredientResponse;
  action: (
    state: IngredientActionState,
    formData: FormData
  ) => Promise<IngredientActionState>;
  state: IngredientActionState;
  pending: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (hasSubmitted && state.success) {
      onSuccess();
      onCancel();
    }
  }, [hasSubmitted, state.success, onSuccess, onCancel]);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>材料を削除</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          className="space-y-4"
          onSubmit={() => {
            setHasSubmitted(true);
          }}
        >
          <input type="hidden" name="id" value={ingredient.id} />
          <input type="hidden" name="version" value={ingredient.version} />
          <p className="text-sm text-muted-foreground">
            {`「${ingredient.name}」を削除すると、この材料はレシピで利用できなくなります。関連レシピがある場合は先に材料を置き換えてから削除してください。`}
          </p>
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="destructive"
              disabled={pending}
              className="flex-1"
            >
              {pending ? "削除中..." : "削除する"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
          {hasSubmitted && state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function IngredientModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-xl"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
