import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { teamMembers, teams } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { ValidationError } from '@/domain/shared/errors';

export interface TeamContext {
  userId: number;
  teamId: number;
  role: string;
}

export async function getCurrentTeamContext(): Promise<TeamContext | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, session.user.id),
    with: {
      team: {
        columns: {
          id: true,
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  return {
    userId: session.user.id,
    teamId: membership.teamId,
    role: membership.role,
  };
}

export async function requireTeamContext(): Promise<TeamContext> {
  const context = await getCurrentTeamContext();
  if (!context) {
    throw new ValidationError('認証が必要です', 'AUTH_REQUIRED');
  }

  return context;
}
