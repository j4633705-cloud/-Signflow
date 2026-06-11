import { ZDocumentLiteSchema } from '@signflow/lib/types/document';
import { ZRecipientLiteSchema } from '@signflow/lib/types/recipient';
import DocumentDataSchema from '@signflow/prisma/generated/zod/modelSchema/DocumentDataSchema';
import DocumentMetaSchema from '@signflow/prisma/generated/zod/modelSchema/DocumentMetaSchema';
import EnvelopeItemSchema from '@signflow/prisma/generated/zod/modelSchema/EnvelopeItemSchema';
import FieldSchema from '@signflow/prisma/generated/zod/modelSchema/FieldSchema';
import SignatureSchema from '@signflow/prisma/generated/zod/modelSchema/SignatureSchema';
import { z } from 'zod';

export const ZGetMultiSignDocumentRequestSchema = z.object({
  token: z.string().min(1, { message: 'Token is required' }),
});

export const ZGetMultiSignDocumentResponseSchema = ZDocumentLiteSchema.extend({
  documentData: DocumentDataSchema.pick({
    type: true,
    id: true,
    data: true,
    initialData: true,
  }),
  documentMeta: DocumentMetaSchema.pick({
    signingOrder: true,
    distributionMethod: true,
    id: true,
    subject: true,
    message: true,
    timezone: true,
    dateFormat: true,
    redirectUrl: true,
    typedSignatureEnabled: true,
    uploadSignatureEnabled: true,
    drawSignatureEnabled: true,
    allowDictateNextSigner: true,
    language: true,
    emailSettings: true,
  }).nullable(),
  fields: z.array(
    FieldSchema.extend({
      recipient: ZRecipientLiteSchema,
      signature: SignatureSchema.nullable(),
    }),
  ),
  envelopeItems: EnvelopeItemSchema.pick({
    id: true,
    envelopeId: true,
  }).array(),
});

export type TGetMultiSignDocumentRequestSchema = z.infer<typeof ZGetMultiSignDocumentRequestSchema>;
export type TGetMultiSignDocumentResponseSchema = z.infer<typeof ZGetMultiSignDocumentResponseSchema>;
