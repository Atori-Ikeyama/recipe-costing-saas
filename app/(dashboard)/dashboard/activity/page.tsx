import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'たった今';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)}分前`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)}時間前`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}日前`;
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'サインアップしました';
    case ActivityType.SIGN_IN:
      return 'サインインしました';
    case ActivityType.SIGN_OUT:
      return 'サインアウトしました';
    case ActivityType.UPDATE_PASSWORD:
      return 'パスワードを変更しました';
    case ActivityType.DELETE_ACCOUNT:
      return 'アカウントを削除しました';
    case ActivityType.UPDATE_ACCOUNT:
      return 'アカウント情報を更新しました';
    case ActivityType.CREATE_TEAM:
      return '新しいチームを作成しました';
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'チームメンバーを削除しました';
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'チームメンバーを招待しました';
    case ActivityType.ACCEPT_INVITATION:
      return '招待を承認しました';
    default:
      return '不明な操作が発生しました';
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        アクティビティログ
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>最近の操作</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(
                  log.action as ActivityType
                );

                return (
                  <li key={log.id} className="flex items-center space-x-4">
                    <div className="bg-orange-100 rounded-full p-2">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction}
                        {log.ipAddress ? `（IP: ${log.ipAddress}）` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                まだアクティビティがありません
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                サインインやアカウント情報の更新などを行うと、ここに表示されます。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
