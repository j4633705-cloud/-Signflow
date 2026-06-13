import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '@signflow/lib/constants/organisations';
import { AppError, AppErrorCode } from '@signflow/lib/errors/app-error';
import { stripe } from '@signflow/lib/server-only/stripe';
import { buildOrganisationWhereQuery } from '@signflow/lib/utils/organisations';
import { prisma } from '@signflow/prisma';

export type GetSubscriptionOptions = {
  userId: number;
  organisationId: string;
};

export const getSubscription = async ({ organisationId, userId }: GetSubscriptionOptions) => {
  const organisation = await prisma.organisation.findFirst({
    where: buildOrganisationWhereQuery({
      organisationId,
      userId,
      roles: ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP.MANAGE_ORGANISATION,
    }),
    include: {
      subscription: true,
    },
  });

  if (!organisation) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Organisation not found',
    });
  }

  if (!organisation.subscription) {
    return null;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(organisation.subscription.planId, {
    expand: ['items.data.price.product'],
  });

  return {
    organisationSubscription: organisation.subscription,
    stripeSubscription,
  };
};
