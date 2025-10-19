import Link from 'next/link';

import { listRecipes } from '@/application/recipes';
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
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

export default async function RecipesPage() {
  const recipes = await listRecipes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">レシピ</h1>
        <Button asChild>
          <Link href="/dashboard/recipes/new">新規作成</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>登録済みレシピ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>仕上がり量</TableHead>
                <TableHead>提供量</TableHead>
                <TableHead>更新バージョン</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.length > 0 ? (
                recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.name}</TableCell>
                    <TableCell>
                      {recipe.batchOutputQty} {recipe.batchOutputUnit}
                    </TableCell>
                    <TableCell>
                      {recipe.servingSizeQty} {recipe.servingSizeUnit}
                    </TableCell>
                    <TableCell>v{recipe.version}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/recipes/${recipe.id}`}>
                          詳細
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    レシピがまだありません。<br />
                    新規作成から登録を始めましょう。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableCaption>レシピは提供数やコスト計算の基礎になります。</TableCaption>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
