"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Loader2, Trash2, UserPlus } from "lucide-react";

import { inviteTeamMember, removeTeamMember } from "@/app/(login)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamDataWithMembers, User } from "@/lib/db/schema";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type InviteState = {
  error?: string;
  success?: string;
};

type RemoveState = {
  error?: string;
  success?: string;
};

export default function TeamPage() {
  const {
    data: team,
    isLoading,
    mutate: mutateTeam,
  } = useSWR<TeamDataWithMembers | null>("/api/team", fetcher);
  const { data: user } = useSWR<User | null>("/api/user", fetcher);
  const [inviteState, inviteAction, invitePending] = useActionState<
    InviteState,
    FormData
  >(inviteTeamMember, {});
  const [removeState, removeAction, removePending] = useActionState<
    RemoveState,
    FormData
  >(removeTeamMember, {});
  const inviteFormRef = useRef<HTMLFormElement>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

  useEffect(() => {
    if (inviteState?.success) {
      mutateTeam();
      inviteFormRef.current?.reset();
    }
  }, [inviteState?.success, mutateTeam]);

  useEffect(() => {
    if (removeState?.success) {
      mutateTeam();
    }
  }, [removeState?.success, mutateTeam]);

  useEffect(() => {
    if (!removePending && removingMemberId !== null) {
      setRemovingMemberId(null);
    }
  }, [removePending, removingMemberId]);

  const memberCount = team?.teamMembers?.length ?? 0;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        チーム管理
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2 border-none shadow-none">
          <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
            <div>
              <CardTitle>メンバー</CardTitle>
            </div>
            {team?.name ? (
              <span className="text-sm text-gray-500">
                チーム名: {team.name}・メンバー数: {memberCount}
              </span>
            ) : null}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                読み込み中...
              </div>
            ) : !team ? (
              <p className="text-sm text-gray-500">
                チーム情報が見つかりませんでした。
              </p>
            ) : memberCount === 0 ? (
              <p className="text-sm text-gray-500">
                まだチームメンバーがいません。招待を送信してください。
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>氏名</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead className="w-24">役割</TableHead>
                    <TableHead className="w-20 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.teamMembers.map((member) => {
                    const isOwner = member.role === "owner";
                    const isSelf = member.user.id === user?.id;
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.user.name || "未設定"}
                        </TableCell>
                        <TableCell>{member.user.email}</TableCell>
                        <TableCell className="capitalize">
                          {member.role}
                        </TableCell>
                        <TableCell className="text-right">
                          <form
                            action={removeAction}
                            onSubmit={() => setRemovingMemberId(member.id)}
                          >
                            <input
                              type="hidden"
                              name="memberId"
                              value={member.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              disabled={removePending || isOwner || isSelf}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {removePending &&
                              removingMemberId === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              <span className="sr-only">メンバーを削除</span>
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {removeState?.error && (
              <p className="text-sm text-red-500 mt-4">{removeState.error}</p>
            )}
            {removeState?.success && (
              <p className="text-sm text-green-500 mt-4">
                {removeState.success}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-none">
          <CardHeader>
            <CardTitle>メンバーを招待</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              ref={inviteFormRef}
              className="space-y-4"
              action={inviteAction}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <Label htmlFor="invite-email" className="mb-2">
                    メールアドレス
                  </Label>
                  <Input
                    id="invite-email"
                    name="email"
                    type="email"
                    placeholder="example@company.com"
                    required
                    maxLength={255}
                  />
                </div>
                <div>
                  <Label htmlFor="invite-role" className="mb-2">
                    役割
                  </Label>
                  <select
                    id="invite-role"
                    name="role"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    defaultValue="member"
                    required
                  >
                    <option value="member">メンバー</option>
                    <option value="owner">オーナー</option>
                  </select>
                </div>
              </div>
              {inviteState?.error && (
                <p className="text-sm text-red-500">{inviteState.error}</p>
              )}
              {inviteState?.success && (
                <p className="text-sm text-green-500">{inviteState.success}</p>
              )}
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={invitePending}
              >
                {invitePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    招待を送信
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
