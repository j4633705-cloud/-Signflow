import { z } from 'zod';

export const ZAddCustomDomainSchema = z.object({
  domain: z
    .string()
    .min(3)
    .max(253)
    .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/, 'Invalid domain format'),
});

export const ZVerifyCustomDomainSchema = z.object({
  id: z.string(),
});

export const ZRemoveCustomDomainSchema = z.object({
  id: z.string(),
});

export const ZListCustomDomainsSchema = z.object({
  teamId: z.number(),
});
