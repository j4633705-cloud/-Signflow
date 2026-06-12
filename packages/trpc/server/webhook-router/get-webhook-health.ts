import { WebhookCallStatus } from '@prisma/client';
import { TEAM_MEMBER_ROLE_PERMISSIONS_MAP } from '@signflow/lib/constants/teams';
import { AppError, AppErrorCode } from '@signflow/lib/errors/app-error';
import { buildTeamWhereQuery } from '@signflow/lib/utils/teams';
import { prisma } from '@signflow/prisma';
import { authenticatedProcedure } from '../trpc';
import { ZGetWebhookByIdRequestSchema } from './schema';

export type TWebhookHealth = {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastCallAt: Date | null;
  lastCallStatus: string | null;
  successRate: number;
};

export const getWebhookHealthRoute = authenticatedProcedure
  .input(ZGetWebhookByIdRequestSchema)
  .query(async ({ input, ctx }) => {
    const { id } = input;

    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        team: buildTeamWhereQuery({
          teamId: ctx.teamId,
          userId: ctx.user.id,
          roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
        }),
      },
    });

    if (!webhook) {
      throw new AppError(AppErrorCode.NOT_FOUND);
    }

    const [totalCalls, successfulCalls, failedCalls, lastCall] = await Promise.all([
      prisma.webhookCall.count({ where: { webhookId: id } }),
      prisma.webhookCall.count({ where: { webhookId: id, status: WebhookCallStatus.SUCCESS } }),
      prisma.webhookCall.count({ where: { webhookId: id, status: WebhookCallStatus.FAILED } }),
      prisma.webhookCall.findFirst({
        where: { webhookId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, status: true },
      }),
    ]);

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      lastCallAt: lastCall?.createdAt ?? null,
      lastCallStatus: lastCall?.status ?? null,
      successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 100,
    } satisfies TWebhookHealth;
  });
