import type { Prisma, WebhookTriggerEvents } from '@prisma/client';
import { prisma } from '@signflow/prisma';
import type { TWebhookRetryConfig } from '@signflow/trpc/server/webhook-router/schema';
import { TEAM_MEMBER_ROLE_PERMISSIONS_MAP } from '../../constants/teams';
import { AppError, AppErrorCode } from '../../errors/app-error';
import { buildTeamWhereQuery } from '../../utils/teams';

export interface CreateWebhookOptions {
  webhookUrl: string;
  eventTriggers: WebhookTriggerEvents[];
  secret: string | null;
  enabled: boolean;
  retryConfig?: TWebhookRetryConfig;
  userId: number;
  teamId: number;
}

const DEFAULT_RETRY_CONFIG: TWebhookRetryConfig = {
  maxRetries: 3,
  backoffDelay: 1000,
  backoffType: 'exponential',
};

export const createWebhook = async ({
  webhookUrl,
  eventTriggers,
  secret,
  enabled,
  retryConfig,
  userId,
  teamId,
}: CreateWebhookOptions) => {
  const team = await prisma.team.findFirst({
    where: buildTeamWhereQuery({
      teamId,
      userId,
      roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
    }),
  });

  if (!team) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Team not found',
    });
  }

  const data: Prisma.WebhookCreateInput = {
    webhookUrl,
    eventTriggers,
    secret,
    enabled,
    userId,
    teamId,
  };

  if (retryConfig) {
    data.retryConfig = retryConfig;
  }

  return await prisma.webhook.create({ data });
};

export { DEFAULT_RETRY_CONFIG };
