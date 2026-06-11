import { ZOrganisationSchema } from '@signflow/lib/types/organisation';
import OrganisationClaimSchema from '@signflow/prisma/generated/zod/modelSchema/OrganisationClaimSchema';
import OrganisationGlobalSettingsSchema from '@signflow/prisma/generated/zod/modelSchema/OrganisationGlobalSettingsSchema';
import OrganisationGroupMemberSchema from '@signflow/prisma/generated/zod/modelSchema/OrganisationGroupMemberSchema';
import OrganisationGroupSchema from '@signflow/prisma/generated/zod/modelSchema/OrganisationGroupSchema';
import OrganisationMemberSchema from '@signflow/prisma/generated/zod/modelSchema/OrganisationMemberSchema';
import OrganisationMonthlyStatSchema from '@signflow/prisma/generated/zod/modelSchema/OrganisationMonthlyStatSchema';
import SubscriptionSchema from '@signflow/prisma/generated/zod/modelSchema/SubscriptionSchema';
import TeamSchema from '@signflow/prisma/generated/zod/modelSchema/TeamSchema';
import UserSchema from '@signflow/prisma/generated/zod/modelSchema/UserSchema';
import { z } from 'zod';

export const ZGetAdminOrganisationRequestSchema = z.object({
  organisationId: z.string(),
});

export const ZGetAdminOrganisationResponseSchema = ZOrganisationSchema.extend({
  organisationGlobalSettings: OrganisationGlobalSettingsSchema,
  teams: z.array(
    TeamSchema.pick({
      id: true,
      name: true,
      url: true,
      createdAt: true,
      avatarImageId: true,
      organisationId: true,
    }),
  ),
  members: OrganisationMemberSchema.extend({
    user: UserSchema.pick({
      id: true,
      email: true,
      name: true,
    }),
    organisationGroupMembers: z.array(
      OrganisationGroupMemberSchema.pick({
        id: true,
        groupId: true,
      }).extend({
        group: OrganisationGroupSchema.pick({
          id: true,
          type: true,
          organisationRole: true,
        }),
      }),
    ),
  }).array(),
  subscription: SubscriptionSchema.nullable(),
  organisationClaim: OrganisationClaimSchema,
  monthlyStats: z.array(
    OrganisationMonthlyStatSchema.pick({
      period: true,
      documentCount: true,
      emailCount: true,
      apiCount: true,
      emailReports: true,
    }),
  ),
});

export type TGetAdminOrganisationResponse = z.infer<typeof ZGetAdminOrganisationResponseSchema>;
