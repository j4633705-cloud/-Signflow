import type { RequestMetadata } from '@signflow/lib/universal/extract-request-metadata';

export type HonoAuthContext = {
  Variables: {
    requestMetadata: RequestMetadata;
  };
};
