"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useActionState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlusCircle, PencilLine, Trash2 } from "lucide-react";

import type { SupplierResponse } from "@/application/suppliers/presenter";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
} from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SupplierActionState = {
  error?: string;
  success?: string;
};

interface SuppliersDashboardProps {
  initialSuppliers: SupplierResponse[];
  initialQuery: string;
}

type FormMode =
  | { mode: "create"; supplier: null }
  | { mode: "edit"; supplier: SupplierResponse }
  | { mode: "delete"; supplier: SupplierResponse };

const defaultActionState: SupplierActionState = {};

export function SuppliersDashboard({
  initialSuppliers,
  initialQuery,
}: SuppliersDashboardProps) {
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
    initialSuppliers.length > 0 ? initialSuppliers[0]!.id : null
  );
  const [suppliers, setSuppliers] = React.useState(initialSuppliers);
  const [createState, createAction, createPending] = useActionState(
    createSupplierAction,
    defaultActionState
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateSupplierAction,
    defaultActionState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteSupplierAction,
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
    setSuppliers(initialSuppliers);
  }, [initialSuppliers]);

  React.useEffect(() => {
    if (formState?.mode !== "edit") {
      return;
    }

    const updated = initialSuppliers.find(
      (item) => item.id === formState.supplier.id
    );
    if (
      updated &&
      (updated.name !== formState.supplier.name ||
        updated.leadTimeDays !== formState.supplier.leadTimeDays)
    ) {
      setFormState({ mode: "edit", supplier: updated });
    }
  }, [initialSuppliers, formState]);

  React.useEffect(() => {
    if (initialSuppliers.length === 0) {
      if (selectedId !== null) {
        setSelectedId(null);
      }
      if (formState?.mode === "edit") {
        setFormState(null);
      }
      return;
    }

    if (!selectedId || !initialSuppliers.some((item) => item.id === selectedId)) {
      setSelectedId(initialSuppliers[0]!.id);
    }
  }, [initialSuppliers, selectedId, formState]);

  const openCreateModal = React.useCallback(() => {
    setFormState({ mode: "create", supplier: null });
  }, []);

  const openEditModal = React.useCallback((supplier: SupplierResponse) => {
    setSelectedId(supplier.id);
    setFormState({ mode: "edit", supplier });
  }, []);

  const openDeleteModal = React.useCallback((supplier: SupplierResponse) => {
    setSelectedId(supplier.id);
    setFormState({ mode: "delete", supplier });
  }, []);

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
          title: "仕入先を登録",
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
          key: formState.supplier.id,
          title: `${formState.supplier.name} を編集`,
          action: updateAction,
          state: updateState,
          pending: updatePending,
          defaultValues: formState.supplier,
        },
      };
    }

    return {
      type: "delete" as const,
      props: {
        supplier: formState.supplier,
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

  const columns = React.useMemo<ColumnDef<SupplierResponse>[]>(
    () => [
      {
        accessorKey: "name",
        header: "仕入先名",
        cell: ({ row }) => (
          <div className="font-medium text-foreground">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "leadTimeDays",
        header: "リードタイム",
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {row.original.leadTimeDays} 日
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
              aria-label="仕入先を編集"
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
              aria-label="仕入先を削除"
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
    data: suppliers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <CardTitle className="shrink-0">仕入先一覧</CardTitle>
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:max-w-lg"
            >
              <Input
                name="q"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="仕入先名で検索"
                className="h-9 sm:flex-1"
                autoComplete="off"
                aria-label="仕入先名で検索"
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
                    仕入先が登録されていません。新規追加から登録してください。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <SupplierModal open={isModalOpen} onClose={closeModal}>
        {modalContent?.type === "form" ? (
          <SupplierForm
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
          <DeleteSupplierConfirm
            key={`delete-${modalContent.props.supplier.id}`}
            supplier={modalContent.props.supplier}
            action={modalContent.props.action}
            state={modalContent.props.state}
            pending={modalContent.props.pending}
            onCancel={closeModal}
            onSuccess={() => {
              const targetId = modalContent.props.supplier.id;
              setSelectedId((current) =>
                current === targetId ? null : current
              );
            }}
          />
        ) : null}
      </SupplierModal>
    </div>
  );
}

interface SupplierFormProps {
  title: string;
  action: (
    state: SupplierActionState,
    formData: FormData
  ) => Promise<SupplierActionState>;
  state: SupplierActionState;
  pending: boolean;
  defaultValues?: SupplierResponse;
  onCancel?: () => void;
}

function SupplierForm({
  title,
  action,
  state,
  pending,
  defaultValues,
  onCancel,
}: SupplierFormProps) {
  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (hasSubmitted && state.success && onCancel) {
      onCancel();
    }
  }, [hasSubmitted, state.success, onCancel]);

  return (
    <Card className="h-fit">
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
            <input type="hidden" name="id" value={defaultValues.id} />
          ) : null}
          <Field>
            <Label htmlFor="name">仕入先名</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name ?? ""}
              placeholder="株式会社〇〇商店"
              autoFocus
              required
            />
          </Field>
          <Field>
            <Label htmlFor="leadTimeDays">リードタイム（日）</Label>
            <Input
              id="leadTimeDays"
              name="leadTimeDays"
              type="number"
              min={0}
              step={1}
              defaultValue={defaultValues?.leadTimeDays ?? 0}
              required
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "保存中..." : "保存"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
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

function DeleteSupplierConfirm({
  supplier,
  action,
  state,
  pending,
  onCancel,
  onSuccess,
}: {
  supplier: SupplierResponse;
  action: (
    state: SupplierActionState,
    formData: FormData
  ) => Promise<SupplierActionState>;
  state: SupplierActionState;
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
        <CardTitle>仕入先を削除</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          className="space-y-4"
          onSubmit={() => {
            setHasSubmitted(true);
          }}
        >
          <input type="hidden" name="id" value={supplier.id} />
          <p className="text-sm text-muted-foreground">
            {`「${supplier.name}」を削除すると、この仕入先を割り当てた材料では使用できなくなります。削除前に材料の仕入先を変更してから進めてください。`}
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

function SupplierModal({
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
