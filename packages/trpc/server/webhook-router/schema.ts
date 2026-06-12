import { WebhookTriggerEvents } from '@prisma/client';
import { isPrivateUrl } from '@signflow/lib/server-only/webhooks/is-private-url';
import { z } from 'zod';

export const ZWebhookTriggerEventsSchema = z.nativeEnum(WebhookTriggerEvents);

export const ZWebhookUrlSchema = z
  .string()
  .url()
  .refine((url) => !isPrivateUrl(url), {
    message: 'Webhook URL cannot point to a private or loopback address',
  });

export const ZWebhookRetryConfigSchema = z.object({
  maxRetries: z.number().int().min(0).max(10).default(3),
  backoffDelay: z.number().int().min(100).max(60000).default(1000),
  backoffType: z.enum(['fixed', 'exponential']).default('exponential'),
});

export type TWebhookRetryConfig = z.infer<typeof ZWebhookRetryConfigSchema>;

export const ZCreateWebhookRequestSchema = z.object({
  webhookUrl: ZWebhookUrlSchema,
  eventTriggers: z
    .array(z.nativeEnum(WebhookTriggerEvents))
    .min(1, { message: 'At least one event trigger is required' }),
  secret: z.string().nullable(),
  enabled: z.boolean(),
  retryConfig: ZWebhookRetryConfigSchema.optional(),
});

export type TCreateWebhookFormSchema = z.infer<typeof ZCreateWebhookRequestSchema>;

export const ZGetWebhookByIdRequestSchema = z.object({
  id: z.string(),
});

export type TGetWebhookByIdRequestSchema = z.infer<typeof ZGetWebhookByIdRequestSchema>;

export const ZEditWebhookRequestSchema = ZCreateWebhookRequestSchema.extend({
  id: z.string(),
});

export type TEditWebhookRequestSchema = z.infer<typeof ZEditWebhookRequestSchema>;

export const ZDeleteWebhookRequestSchema = z.object({
  id: z.string(),
});

export type TDeleteWebhookRequestSchema = z.infer<typeof ZDeleteWebhookRequestSchema>;

export const ZTriggerTestWebhookRequestSchema = z.object({
  id: z.string(),
  event: z.nativeEnum(WebhookTriggerEvents),
});

export type TTriggerTestWebhookRequestSchema = z.infer<typeof ZTriggerTestWebhookRequestSchema>;
