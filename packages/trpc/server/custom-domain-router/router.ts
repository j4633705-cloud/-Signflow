import { TEAM_MEMBER_ROLE_PERMISSIONS_MAP } from '@signflow/lib/constants/teams';
import { AppError, AppErrorCode } from '@signflow/lib/errors/app-error';
import {
  generateVerificationToken,
  verifyDomainOwnership,
} from '@signflow/lib/server-only/custom-domains/verify-domain';
import { buildTeamWhereQuery } from '@signflow/lib/utils/teams';
import { prisma } from '@signflow/prisma';
import { authenticatedProcedure, router } from '../trpc';
import {
  ZAddCustomDomainSchema,
  ZListCustomDomainsSchema,
  ZRemoveCustomDomainSchema,
  ZVerifyCustomDomainSchema,
} from './schema';

export const customDomainRouter = router({
  add: authenticatedProcedure.input(ZAddCustomDomainSchema).mutation(async ({ input, ctx }) => {
    const { domain } = input;

    ctx.logger.info({
      input: {
        domain,
      },
    });

    const teamId = ctx.teamId;

    if (!teamId) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, {
        message: 'Team ID is required',
      });
    }

    const team = await prisma.team.findFirst({
      where: buildTeamWhereQuery({
        teamId,
        userId: ctx.user.id,
        roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
      }),
    });

    if (!team) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, {
        message: 'You do not have permission to manage this team.',
      });
    }

    const existing = await prisma.teamCustomDomain.findFirst({
      where: { domain },
    });

    if (existing) {
      throw new AppError(AppErrorCode.ALREADY_EXISTS, {
        message: 'This domain has already been added.',
      });
    }

    const verificationToken = generateVerificationToken();

    return await prisma.teamCustomDomain.create({
      data: {
        domain,
        verificationToken,
        teamId,
      },
    });
  }),

  verify: authenticatedProcedure.input(ZVerifyCustomDomainSchema).mutation(async ({ input, ctx }) => {
    const { id } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    const customDomain = await prisma.teamCustomDomain.findFirst({
      where: {
        id,
        team: buildTeamWhereQuery({
          teamId: ctx.teamId,
          userId: ctx.user.id,
          roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
        }),
      },
    });

    if (!customDomain) {
      throw new AppError(AppErrorCode.NOT_FOUND, {
        message: 'Custom domain not found',
      });
    }

    const isVerified = await verifyDomainOwnership(customDomain.domain, customDomain.verificationToken);

    if (!isVerified) {
      throw new AppError(AppErrorCode.INVALID_REQUEST, {
        message: 'Domain verification failed. Ensure the TXT record is set correctly.',
      });
    }

    return await prisma.teamCustomDomain.update({
      where: { id },
      data: { verified: true },
    });
  }),

  list: authenticatedProcedure.input(ZListCustomDomainsSchema).query(async ({ input, ctx }) => {
    const { teamId } = input;

    ctx.logger.info({
      input: {
        teamId,
      },
    });

    const domains = await prisma.teamCustomDomain.findMany({
      where: {
        teamId,
        team: buildTeamWhereQuery({
          teamId,
          userId: ctx.user.id,
          roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return domains;
  }),

  remove: authenticatedProcedure.input(ZRemoveCustomDomainSchema).mutation(async ({ input, ctx }) => {
    const { id } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    const customDomain = await prisma.teamCustomDomain.findFirst({
      where: {
        id,
        team: buildTeamWhereQuery({
          teamId: ctx.teamId,
          userId: ctx.user.id,
          roles: TEAM_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_TEAM,
        }),
      },
    });

    if (!customDomain) {
      throw new AppError(AppErrorCode.NOT_FOUND, {
        message: 'Custom domain not found',
      });
    }

    await prisma.teamCustomDomain.delete({
      where: { id },
    });

    return { success: true };
  }),
});
