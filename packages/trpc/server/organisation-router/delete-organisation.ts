import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '@signflow/lib/constants/organisations';
import { AppError, AppErrorCode } from '@signflow/lib/errors/app-error';
import { deleteOrganisation } from '@signflow/lib/server-only/organisation/delete-organisation';
import { buildOrganisationWhereQuery } from '@signflow/lib/utils/organisations';
import { prisma } from '@signflow/prisma';

import { authenticatedProcedure } from '../trpc';
import { ZDeleteOrganisationRequestSchema, ZDeleteOrganisationResponseSchema } from './delete-organisation.types';

export const deleteOrganisationRoute = authenticatedProcedure
  //   .meta(deleteOrganisationMeta)
  .input(ZDeleteOrganisationRequestSchema)
  .output(ZDeleteOrganisationResponseSchema)
  .mutation(async ({ input, ctx }) => {
    const { organisationId } = input;
    const { user } = ctx;

    ctx.logger.info({
      input: {
        organisationId,
      },
    });

    const organisation = await prisma.organisation.findFirst({
      where: buildOrganisationWhereQuery({
        organisationId,
        userId: user.id,
        roles: ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP.DELETE_ORGANISATION,
      }),
      select: {
        id: true,
        owner: {
          select: {
            id: true,
          },
        },
        teams: {
          select: {
            id: true,
          },
        },
        subscription: {
          select: {
            planId: true,
          },
        },
      },
    });

    if (!organisation) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, {
        message: 'You are not authorized to delete this organisation',
      });
    }

    await deleteOrganisation({ organisation });
  });
