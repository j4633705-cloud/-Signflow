import { EmailDomainStatus } from '@prisma/client';
import { ZEmailDomainManySchema } from '@signflow/lib/types/email-domain';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@signflow/lib/types/search-params';
import { z } from 'zod';

export const ZFindOrganisationEmailDomainsRequestSchema = ZFindSearchParamsSchema.extend({
  organisationId: z.string(),
  emailDomainId: z.string().optional(),
  statuses: z.nativeEnum(EmailDomainStatus).array().optional(),
});

export const ZFindOrganisationEmailDomainsResponseSchema = ZFindResultResponse.extend({
  data: z.array(
    ZEmailDomainManySchema.extend({
      emailCount: z.number(),
    }),
  ),
});

export type TFindOrganisationEmailDomainsResponse = z.infer<typeof ZFindOrganisationEmailDomainsResponseSchema>;
