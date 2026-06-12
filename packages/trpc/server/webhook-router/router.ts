import { createWebhook } from '@signflow/lib/server-only/webhooks/create-webhook';
import { deleteWebhookById } from '@signflow/lib/server-only/webhooks/delete-webhook-by-id';
import { editWebhook } from '@signflow/lib/server-only/webhooks/edit-webhook';
import { getWebhookById } from '@signflow/lib/server-only/webhooks/get-webhook-by-id';
import { getWebhooksByTeamId } from '@signflow/lib/server-only/webhooks/get-webhooks-by-team-id';
import { triggerTestWebhook } from '@signflow/lib/server-only/webhooks/trigger-test-webhook';

import { authenticatedProcedure, router } from '../trpc';
import { findWebhookCallsRoute } from './find-webhook-calls';
import { getWebhookHealthRoute } from './get-webhook-health';
import { resendWebhookCallRoute } from './resend-webhook-call';
import {
  ZCreateWebhookRequestSchema,
  ZDeleteWebhookRequestSchema,
  ZEditWebhookRequestSchema,
  ZGetWebhookByIdRequestSchema,
  ZTriggerTestWebhookRequestSchema,
} from './schema';

export const webhookRouter = router({
  health: getWebhookHealthRoute,
  calls: {
    find: findWebhookCallsRoute,
    resend: resendWebhookCallRoute,
  },

  getTeamWebhooks: authenticatedProcedure.query(async ({ ctx }) => {
    ctx.logger.info({
      input: {
        teamId: ctx.teamId,
      },
    });

    return await getWebhooksByTeamId(ctx.teamId, ctx.user.id);
  }),

  getWebhookById: authenticatedProcedure.input(ZGetWebhookByIdRequestSchema).query(async ({ input, ctx }) => {
    const { id } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    return await getWebhookById({
      id,
      userId: ctx.user.id,
      teamId: ctx.teamId,
    });
  }),

  createWebhook: authenticatedProcedure.input(ZCreateWebhookRequestSchema).mutation(async ({ input, ctx }) => {
    const { enabled, eventTriggers, secret, webhookUrl, retryConfig } = input;

    return await createWebhook({
      enabled,
      secret,
      webhookUrl,
      eventTriggers,
      retryConfig,
      teamId: ctx.teamId,
      userId: ctx.user.id,
    });
  }),

  deleteWebhook: authenticatedProcedure.input(ZDeleteWebhookRequestSchema).mutation(async ({ input, ctx }) => {
    const { id } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    return await deleteWebhookById({
      id,
      teamId: ctx.teamId,
      userId: ctx.user.id,
    });
  }),

  editWebhook: authenticatedProcedure.input(ZEditWebhookRequestSchema).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    return await editWebhook({
      id,
      data,
      userId: ctx.user.id,
      teamId: ctx.teamId,
    });
  }),

  testWebhook: authenticatedProcedure.input(ZTriggerTestWebhookRequestSchema).mutation(async ({ input, ctx }) => {
    const { id, event } = input;

    ctx.logger.info({
      input: {
        id,
        event,
      },
    });

    return await triggerTestWebhook({
      id,
      event,
      userId: ctx.user.id,
      teamId: ctx.teamId,
    });
  }),
});
