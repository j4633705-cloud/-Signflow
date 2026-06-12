import { TEAM_MEMBER_ROLE_PERMISSIONS_MAP } from '@signflow/lib/constants/teams';
import { AppError, AppErrorCode } from '@signflow/lib/errors/app-error';
import { buildTeamWhereQuery } from '@signflow/lib/utils/teams';
import { prisma } from '@signflow/prisma';

import { authenticatedProcedure, router } from '../trpc';
import { ZDeleteSlackIntegrationSchema, ZGetSlackIntegrationSchema, ZUpdateSlackIntegrationSchema } from './schema';

export const slackRouter = router({
  get: authenticatedProcedure.input(ZGetSlackIntegrationSchema).query(async ({ input, ctx }) => {
    const { teamId } = input;

    ctx.logger.info({
      input: {
        teamId,
      },
    });

    const integration = await prisma.teamSlackIntegration.findFirst({
      where: {
        teamId,
        team: buildTeamWhereQuery({
          teamId,
          userId: ctx.user.id,
          roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
        }),
      },
    });

    if (!integration) {
      return null;
    }

    return integration;
  }),

  update: authenticatedProcedure.input(ZUpdateSlackIntegrationSchema).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    const integration = await prisma.teamSlackIntegration.findFirst({
      where: {
        id,
        team: buildTeamWhereQuery({
          teamId: ctx.teamId,
          userId: ctx.user.id,
          roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
        }),
      },
    });

    if (!integration) {
      throw new AppError(AppErrorCode.NOT_FOUND, { message: 'Slack integration not found' });
    }

    return await prisma.teamSlackIntegration.update({
      where: { id },
      data: {
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        ...(data.eventTriggers !== undefined ? { eventTriggers: data.eventTriggers } : {}),
        ...(data.defaultChannelId !== undefined ? { defaultChannelId: data.defaultChannelId } : {}),
        ...(data.defaultChannelName !== undefined ? { defaultChannelName: data.defaultChannelName } : {}),
      },
    });
  }),

  delete: authenticatedProcedure.input(ZDeleteSlackIntegrationSchema).mutation(async ({ input, ctx }) => {
    const { id } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    const integration = await prisma.teamSlackIntegration.findFirst({
      where: {
        id,
        team: buildTeamWhereQuery({
          teamId: ctx.teamId,
          userId: ctx.user.id,
          roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
        }),
      },
    });

    if (!integration) {
      throw new AppError(AppErrorCode.NOT_FOUND, { message: 'Slack integration not found' });
    }

    await fetch('https://slack.com/api/auth.revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${integration.accessToken}`,
      },
    });

    await prisma.teamSlackIntegration.delete({
      where: { id },
    });

    return { success: true };
  }),
});
