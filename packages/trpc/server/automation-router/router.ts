import { TEAM_MEMBER_ROLE_PERMISSIONS_MAP } from '@signflow/lib/constants/teams';
import { AppError, AppErrorCode } from '@signflow/lib/errors/app-error';
import { buildTeamWhereQuery } from '@signflow/lib/utils/teams';
import { prisma } from '@signflow/prisma';

import { authenticatedProcedure, router } from '../trpc';
import {
  ZCreateAutomationSchema,
  ZDeleteAutomationSchema,
  ZEditAutomationSchema,
  ZGetAutomationByIdSchema,
  ZListAutomationsSchema,
} from './schema';

export const automationRouter = router({
  get: authenticatedProcedure.input(ZGetAutomationByIdSchema).query(async ({ input, ctx }) => {
    const { id } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    const automation = await prisma.automation.findFirst({
      where: {
        id,
        team: buildTeamWhereQuery({
          teamId: ctx.teamId,
          userId: ctx.user.id,
          roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
        }),
      },
      include: {
        trigger: true,
        actions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!automation) {
      throw new AppError(AppErrorCode.NOT_FOUND, { message: 'Automation not found' });
    }

    return automation;
  }),

  list: authenticatedProcedure.input(ZListAutomationsSchema).query(async ({ input, ctx }) => {
    const { teamId } = input;

    ctx.logger.info({
      input: {
        teamId,
      },
    });

    const automations = await prisma.automation.findMany({
      where: {
        teamId,
        team: buildTeamWhereQuery({
          teamId,
          userId: ctx.user.id,
          roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
        }),
      },
      include: {
        trigger: true,
        actions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return automations;
  }),

  create: authenticatedProcedure.input(ZCreateAutomationSchema).mutation(async ({ input, ctx }) => {
    const { name, description, enabled, triggerType, triggerConfig, actions } = input;

    ctx.logger.info({
      input: {
        name,
      },
    });

    return await prisma.$transaction(async (tx) => {
      const automation = await tx.automation.create({
        data: {
          name,
          description,
          enabled,
          teamId: ctx.teamId,
          trigger: {
            create: {
              type: triggerType,
              config: triggerConfig ?? {},
            },
          },
          actions: {
            create: actions.map((action) => ({
              type: action.type,
              config: action.config,
              order: action.order,
            })),
          },
        },
        include: {
          trigger: true,
          actions: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      return automation;
    });
  }),

  update: authenticatedProcedure.input(ZEditAutomationSchema).mutation(async ({ input, ctx }) => {
    const { id, name, description, enabled, triggerType, triggerConfig, actions } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.automation.findFirst({
        where: {
          id,
          team: buildTeamWhereQuery({
            teamId: ctx.teamId,
            userId: ctx.user.id,
            roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
          }),
        },
      });

      if (!existing) {
        throw new AppError(AppErrorCode.NOT_FOUND, { message: 'Automation not found' });
      }

      await tx.automationTrigger.deleteMany({
        where: { automationId: id },
      });

      await tx.automationAction.deleteMany({
        where: { automationId: id },
      });

      return await tx.automation.update({
        where: { id },
        data: {
          name,
          description,
          enabled,
          trigger: {
            create: {
              type: triggerType,
              config: triggerConfig ?? {},
            },
          },
          actions: {
            create: actions.map((action) => ({
              type: action.type,
              config: action.config,
              order: action.order,
            })),
          },
        },
        include: {
          trigger: true,
          actions: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    });
  }),

  delete: authenticatedProcedure.input(ZDeleteAutomationSchema).mutation(async ({ input, ctx }) => {
    const { id } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    const automation = await prisma.automation.findFirst({
      where: {
        id,
        team: buildTeamWhereQuery({
          teamId: ctx.teamId,
          userId: ctx.user.id,
          roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
        }),
      },
    });

    if (!automation) {
      throw new AppError(AppErrorCode.NOT_FOUND, { message: 'Automation not found' });
    }

    await prisma.automation.delete({
      where: { id },
    });

    return { success: true };
  }),
});
