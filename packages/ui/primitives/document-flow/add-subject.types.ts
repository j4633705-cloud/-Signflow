import { DocumentDistributionMethod } from '@prisma/client';
import { ZDocumentEmailSettingsSchema } from '@signflow/lib/types/document-email';
import { zEmail } from '@signflow/lib/utils/zod';
import { z } from 'zod';

export const ZAddSubjectFormSchema = z.object({
  meta: z.object({
    emailId: z.string().nullable(),
    emailReplyTo: z.preprocess((val) => (val === '' ? undefined : val), zEmail().optional()),
    // emailReplyName: z.string().optional(),
    subject: z.string(),
    message: z.string(),
    distributionMethod: z.nativeEnum(DocumentDistributionMethod).optional().default(DocumentDistributionMethod.EMAIL),
    emailSettings: ZDocumentEmailSettingsSchema,
  }),
});

export type TAddSubjectFormSchema = z.infer<typeof ZAddSubjectFormSchema>;
