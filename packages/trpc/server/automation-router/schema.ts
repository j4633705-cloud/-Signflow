import { z } from 'zod';

export const ZAutomationTriggerConfigSchema = z
  .object({
    templateId: z.string().optional(),
    senderEmail: z.string().email().optional(),
  })
  .optional();

export const ZAutomationActionConfigSchema = z.object({
  // SEND_EMAIL
  email: z.string().email().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  // SEND_SLACK
  channel: z.string().optional(),
  message: z.string().optional(),
  // SEND_WEBHOOK
  url: z.string().url().optional(),
  headers: z.record(z.string()).optional(),
});

export const ZAutomationActionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['SEND_EMAIL', 'SEND_SLACK', 'SEND_WEBHOOK']),
  config: ZAutomationActionConfigSchema,
  order: z.number().int().min(0).default(0),
});

export const ZCreateAutomationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
  triggerType: z.enum(['DOCUMENT_COMPLETED', 'DOCUMENT_SIGNED', 'DOCUMENT_REJECTED', 'ALL_SIGNED']),
  triggerConfig: ZAutomationTriggerConfigSchema,
  actions: z.array(ZAutomationActionSchema).min(1, 'At least one action is required'),
});

export type TCreateAutomationFormSchema = z.infer<typeof ZCreateAutomationSchema>;

export const ZEditAutomationSchema = ZCreateAutomationSchema.extend({
  id: z.string(),
});

export const ZGetAutomationByIdSchema = z.object({
  id: z.string(),
});

export const ZListAutomationsSchema = z.object({
  teamId: z.number(),
});

export const ZDeleteAutomationSchema = z.object({
  id: z.string(),
});
