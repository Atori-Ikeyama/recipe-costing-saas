"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useActionState } from "react";
import { PencilLine, PlusCircle, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { RecipeResponse } from "@/application/recipes/presenter";
import { deleteRecipeAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ActionState = {
  error?: string;
  success?: string;
};

const defaultActionState: ActionState = {};

const formatUnit = (unit: string) => (unit === "meal" ? "食" : unit);

interface RecipeListViewProps {
  recipes: RecipeResponse[];
  initialQuery: string;
}

export function RecipeListView({ recipes, initialQuery }: RecipeListViewProps) {
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

  const [state, action, pending] = useActionState(
    deleteRecipeAction,
    defaultActionState
  );
  const [modalRecipe, setModalRecipe] = React.useState<RecipeResponse | null>(
    null
  );

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

  const openDeleteModal = React.useCallback((recipe: RecipeResponse) => {
    setModalRecipe(recipe);
  }, []);

  const closeModal = React.useCallback(() => {
    setModalRecipe(null);
  }, []);

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <CardTitle className="shrink-0">レシピ一覧</CardTitle>
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:max-w-lg"
            >
              <Input
                name="q"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="レシピ名で検索"
                className="h-9 sm:flex-1"
                autoComplete="off"
                aria-label="レシピ名で検索"
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
          <Button size="sm" asChild>
            <Link href="/dashboard/recipes/new">
              <PlusCircle className="size-4" />
              新規追加
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>レシピ名</TableHead>
                <TableHead>仕上がり食数</TableHead>
                <TableHead>更新バージョン</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.length > 0 ? (
                recipes.map((recipe) => (
                  <TableRow
                    key={recipe.id}
                    onClick={() =>
                      router.push(`/dashboard/recipes/${recipe.id}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/dashboard/recipes/${recipe.id}`);
                      }
                    }}
                    tabIndex={0}
                    className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <TableCell className="font-medium">{recipe.name}</TableCell>
                    <TableCell>
                      {recipe.batchOutputQty}{" "}
                      {formatUnit(recipe.batchOutputUnit)}
                    </TableCell>
                    <TableCell>v{recipe.version}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/dashboard/recipes/${recipe.id}/edit`}
                            aria-label="レシピを編集"
                            title="編集"
                            onClick={(event) => {
                              event.stopPropagation();
                            }}
                          >
                            <PencilLine className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDeleteModal(recipe);
                          }}
                          aria-label="レシピを削除"
                          title="削除"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    レシピが登録されていません。新規追加から登録してください。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RecipeModal open={modalRecipe !== null} onClose={closeModal}>
        {modalRecipe ? (
          <DeleteRecipeConfirm
            recipe={modalRecipe}
            action={action}
            state={state}
            pending={pending}
            onCancel={closeModal}
          />
        ) : null}
      </RecipeModal>
    </div>
  );
}

function DeleteRecipeConfirm({
  recipe,
  action,
  state,
  pending,
  onCancel,
}: {
  recipe: RecipeResponse;
  action: (
    state: ActionState,
    formData: FormData
  ) => Promise<ActionState | void>;
  state: ActionState;
  pending: boolean;
  onCancel: () => void;
}) {
  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (hasSubmitted && state.success) {
      onCancel();
    }
  }, [hasSubmitted, state.success, onCancel]);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>レシピを削除</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          className="space-y-4"
          onSubmit={() => {
            setHasSubmitted(true);
          }}
        >
          <input type="hidden" name="id" value={recipe.id} />
          <input type="hidden" name="version" value={recipe.version} />
          <p className="text-sm text-muted-foreground">
            {`「${recipe.name}」を削除すると、関連するコスト計算や発注プランからも除外されます。`}
            <br />
            この操作は取り消せません。削除してもよろしいですか？
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

function RecipeModal({
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
        className="relative z-10 w-full max-w-lg"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
