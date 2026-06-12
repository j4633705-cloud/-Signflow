import { z } from 'zod';

import { ZWebhookTriggerEventsSchema } from '../webhook-router/schema';

export const ZGetSlackIntegrationSchema = z.object({
  teamId: z.number(),
});

export const ZUpdateSlackIntegrationSchema = z.object({
  id: z.string(),
  enabled: z.boolean().optional(),
  eventTriggers: z.array(ZWebhookTriggerEventsSchema).optional(),
  defaultChannelId: z.string().optional(),
  defaultChannelName: z.string().optional(),
});

export const ZDeleteSlackIntegrationSchema = z.object({
  id: z.string(),
});
