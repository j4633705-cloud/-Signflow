import { ApiContractV1 } from '@signflow/api/v1/contract';
import { ApiContractV1Implementation } from '@signflow/api/v1/implementation';
import { OpenAPIV1 } from '@signflow/api/v1/openapi';
import { testCredentialsHandler } from '@signflow/lib/server-only/public-api/test-credentials';
import { listDocumentsHandler } from '@signflow/lib/server-only/webhooks/zapier/list-documents';
import { subscribeHandler } from '@signflow/lib/server-only/webhooks/zapier/subscribe';
import { unsubscribeHandler } from '@signflow/lib/server-only/webhooks/zapier/unsubscribe';

import type { HonoEnv } from '@signflow/remix/server/router';
import { fetchRequestHandler, TsRestHttpError } from '@ts-rest/serverless/fetch';
import { Hono } from 'hono';

export const tsRestHonoApp = new Hono<HonoEnv>();

tsRestHonoApp
  .get('/openapi', (c) => c.redirect('https://openapi-v1.signflow.com'))
  .get('/openapi.json', (c) => c.json(OpenAPIV1))
  .get('/me', async (c) => testCredentialsHandler(c.req.raw));

tsRestHonoApp.get('/zapier/list-documents', async (c) => listDocumentsHandler(c.req.raw));
tsRestHonoApp.post('/zapier/subscribe', async (c) => subscribeHandler(c.req.raw));
tsRestHonoApp.post('/zapier/unsubscribe', async (c) => unsubscribeHandler(c.req.raw));

tsRestHonoApp.mount('/', async (request) => {
  return fetchRequestHandler({
    request,
    contract: ApiContractV1,
    router: ApiContractV1Implementation,
    options: {
      errorHandler: (err) => {
        if (err instanceof TsRestHttpError && err.statusCode === 500) {
          console.error(err);
        }
      },
    },
  });
});
