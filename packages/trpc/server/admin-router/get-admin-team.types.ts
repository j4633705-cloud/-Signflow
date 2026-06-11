import { OrganisationMemberRoleSchema } from '@signflow/prisma/generated/zod/inputTypeSchemas/OrganisationMemberRoleSchema';
import { TeamMemberRoleSchema } from '@signflow/prisma/generated/zod/inputTypeSchemas/TeamMemberRoleSchema';
import OrganisationMemberInviteSchema from '@signflow/prisma/generated/zod/modelSchema/OrganisationMemberInviteSchema';
import OrganisationMemberSchema from '@signflow/prisma/generated/zod/modelSchema/OrganisationMemberSchema';
import OrganisationSchema from '@signflow/prisma/generated/zod/modelSchema/OrganisationSchema';
import TeamEmailSchema from '@signflow/prisma/generated/zod/modelSchema/TeamEmailSchema';
import TeamGlobalSettingsSchema from '@signflow/prisma/generated/zod/modelSchema/TeamGlobalSettingsSchema';
import TeamSchema from '@signflow/prisma/generated/zod/modelSchema/TeamSchema';
import UserSchema from '@signflow/prisma/generated/zod/modelSchema/UserSchema';
import { z } from 'zod';

export const ZGetAdminTeamRequestSchema = z.object({
  teamId: z.number().min(1),
});

export const ZGetAdminTeamResponseSchema = TeamSchema.extend({
  organisation: OrganisationSchema.pick({
    id: true,
    name: true,
    url: true,
    ownerUserId: true,
  }),
  teamEmail: TeamEmailSchema.nullable(),
  teamGlobalSettings: TeamGlobalSettingsSchema.nullable(),
  memberCount: z.number(),
  teamMembers: OrganisationMemberSchema.pick({
    id: true,
    userId: true,
    createdAt: true,
  })
    .extend({
      user: UserSchema.pick({
        id: true,
        email: true,
        name: true,
      }),
      teamRole: TeamMemberRoleSchema,
      organisationRole: OrganisationMemberRoleSchema,
    })
    .array(),
  pendingInvites: OrganisationMemberInviteSchema.pick({
    id: true,
    email: true,
    createdAt: true,
    organisationRole: true,
    status: true,
  }).array(),
});

export type TGetAdminTeamRequest = z.infer<typeof ZGetAdminTeamRequestSchema>;
export type TGetAdminTeamResponse = z.infer<typeof ZGetAdminTeamResponseSchema>;
