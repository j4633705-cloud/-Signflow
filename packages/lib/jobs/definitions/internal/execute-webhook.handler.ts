import type { Prisma } from '@prisma/client';
import { WebhookCallStatus } from '@prisma/client';
import { executeWebhookCall } from '@signflow/lib/server-only/webhooks/execute-webhook-call';
import { prisma } from '@signflow/prisma';
import type { TWebhookRetryConfig } from '@signflow/trpc/server/webhook-router/schema';

import type { JobRunIO } from '../../client/_internal/job';
import type { TExecuteWebhookJobDefinition } from './execute-webhook';

const getBackoffDelay = (attempt: number, config: TWebhookRetryConfig): number => {
  if (config.backoffType === 'fixed') {
    return config.backoffDelay;
  }

  return Math.min(config.backoffDelay * 2 ** (attempt - 1), 60_000);
};

export const run = async ({ payload, io }: { payload: TExecuteWebhookJobDefinition; io: JobRunIO }) => {
  const { event, webhookId, data } = payload;

  const webhook = await prisma.webhook.findUniqueOrThrow({
    where: {
      id: webhookId,
    },
  });

  const retryConfig: TWebhookRetryConfig = (webhook.retryConfig as TWebhookRetryConfig | null) ?? {
    maxRetries: 3,
    backoffDelay: 1000,
    backoffType: 'exponential',
  };

  const { webhookUrl: url, secret } = webhook;

  const payloadData = {
    event,
    payload: data,
    createdAt: new Date().toISOString(),
    webhookEndpoint: url,
  };

  const result = await executeWebhookCall({ url, body: payloadData, secret });

  const failedCount = await prisma.webhookCall.count({
    where: {
      webhookId: webhook.id,
      event,
      status: WebhookCallStatus.FAILED,
    },
  });

  const attemptNumber = failedCount + 1;

  await prisma.webhookCall.create({
    data: {
      url,
      event,
      retryAttempt: attemptNumber,
      status: result.success ? WebhookCallStatus.SUCCESS : WebhookCallStatus.FAILED,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      requestBody: payloadData as Prisma.InputJsonValue,
      responseCode: result.responseCode,
      responseBody: result.responseBody,
      responseHeaders: result.responseHeaders,
      webhookId: webhook.id,
    },
  });

  if (!result.success) {
    if (attemptNumber < retryConfig.maxRetries) {
      const delay = getBackoffDelay(attemptNumber, retryConfig);

      io.logger.info(`Webhook failed, retrying in ${delay}ms (attempt ${attemptNumber}/${retryConfig.maxRetries})`);

      await io.wait('webhook-retry-delay', delay);

      await io.triggerJob('webhook-retry', {
        name: 'internal.execute-webhook',
        payload: { event, webhookId, data },
      });

      return { success: false, retried: true, status: result.responseCode };
    }

    io.logger.error(`Webhook permanently failed after ${attemptNumber} attempts`);
    return { success: false, retried: false, status: result.responseCode };
  }

  return {
    success: true,
    status: result.responseCode,
  };
};
