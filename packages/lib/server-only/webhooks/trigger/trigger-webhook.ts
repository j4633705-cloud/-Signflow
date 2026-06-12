import type { WebhookTriggerEvents } from '@prisma/client';
import { jobs } from '../../../jobs/client';
import { executeAutomations } from '../../automations/execute-automation';
import { sendSlackNotification } from '../../slack/send-slack-notification';
import { getAllWebhooksByEventTrigger } from '../get-all-webhooks-by-event-trigger';

export type TriggerWebhookOptions = {
  event: WebhookTriggerEvents;
  data: Record<string, unknown>;
  userId: number;
  teamId: number;
};

export const triggerWebhook = async ({ event, data, userId, teamId }: TriggerWebhookOptions) => {
  try {
    const registeredWebhooks = await getAllWebhooksByEventTrigger({ event, userId, teamId });

    if (registeredWebhooks.length > 0) {
      await Promise.allSettled(
        registeredWebhooks.map(async (webhook) => {
          await jobs.triggerJob({
            name: 'internal.execute-webhook',
            payload: {
              event,
              webhookId: webhook.id,
              data,
            },
          });
        }),
      );
    }

    const documentTitle = (data?.documentTitle as string) || (data?.title as string) || 'Untitled';
    const documentId = (data?.documentId as string) || (data?.id as string) || '';
    const triggerUser = (data?.senderName as string) || (data?.userEmail as string) || `User #${userId}`;

    await Promise.allSettled([
      sendSlackNotification({
        event,
        teamId,
        documentTitle,
        documentId,
        triggerUser,
      }),
      executeAutomations({
        event,
        teamId,
        documentId,
        documentTitle,
        triggerUser,
      }),
    ]);
  } catch (err) {
    console.error(err);
    throw new Error(`Failed to trigger webhook`);
  }
};
