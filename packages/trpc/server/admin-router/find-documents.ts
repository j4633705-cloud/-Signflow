import { adminFindDocuments } from '@signflow/lib/server-only/admin/admin-find-documents';
import { mapEnvelopesToDocumentMany } from '@signflow/lib/utils/document';

import { adminProcedure } from '../trpc';
import { ZFindDocumentsRequestSchema, ZFindDocumentsResponseSchema } from './find-documents.types';

export const findDocumentsRoute = adminProcedure
  .input(ZFindDocumentsRequestSchema)
  .output(ZFindDocumentsResponseSchema)
  .query(async ({ input }) => {
    const { query, page, perPage } = input;

    const result = await adminFindDocuments({ query, page, perPage });

    return {
      ...result,
      data: result.data.map(mapEnvelopesToDocumentMany),
    };
  });
