import { API_V2_BETA_URL, API_V2_URL } from '@signflow/lib/constants/app';
import { AppError, genericErrorCodeToTrpcErrorCodeMap } from '@signflow/lib/errors/app-error';
import { createTrpcContext } from '@signflow/trpc/server/context';
import { appRouter } from '@signflow/trpc/server/router';
import { createOpenApiFetchHandler } from '@signflow/trpc/utils/openapi-fetch-handler';
import { handleTrpcRouterError } from '@signflow/trpc/utils/trpc-error-handler';
import type { Context } from 'hono';

type OpenApiTrpcServerHandlerOptions = {
  isBeta: boolean;
};

export const openApiTrpcServerHandler = async (c: Context, { isBeta }: OpenApiTrpcServerHandlerOptions) => {
  return createOpenApiFetchHandler<typeof appRouter>({
    endpoint: isBeta ? API_V2_BETA_URL : API_V2_URL,
    router: appRouter,
    createContext: async () => createTrpcContext({ c, requestSource: 'apiV2' }),
    req: c.req.raw,
    onError: (opts) => handleTrpcRouterError(opts, 'apiV2'),
    // Not sure why we need to do this since we handle it in errorFormatter which runs after this.
    responseMeta: (opts) => {
      if (opts.errors[0]?.cause instanceof AppError) {
        const appError = AppError.parseError(opts.errors[0].cause);

        const httpStatus = genericErrorCodeToTrpcErrorCodeMap[appError.code]?.status ?? 400;

        return {
          status: httpStatus,
        };
      }

      return {};
    },
  });
};
