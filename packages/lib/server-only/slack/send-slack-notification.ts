import type { WebhookTriggerEvents } from '@prisma/client';
import { prisma } from '@signflow/prisma';

export const sendSlackNotification = async ({
  event,
  teamId,
  documentTitle,
  documentId,
  triggerUser,
}: {
  event: WebhookTriggerEvents;
  teamId: number;
  documentTitle: string;
  documentId: string;
  triggerUser: string;
}) => {
  const integration = await prisma.teamSlackIntegration.findFirst({
    where: { teamId, enabled: true, eventTriggers: { has: event } },
  });
  if (!integration) {
    return;
  }

  const eventLabels: Record<string, string> = {
    DOCUMENT_CREATED: ':page_facing_up: Document Created',
    DOCUMENT_SENT: ':email: Document Sent',
    DOCUMENT_OPENED: ':eye: Document Opened',
    DOCUMENT_SIGNED: ':pencil2: Document Signed',
    DOCUMENT_COMPLETED: ':white_check_mark: Document Completed',
    DOCUMENT_REJECTED: ':x: Document Rejected',
    DOCUMENT_CANCELLED: ':no_entry: Document Cancelled',
    RECIPIENT_EXPIRED: ':alarm_clock: Recipient Expired',
    DOCUMENT_RECIPIENT_COMPLETED: ':white_check_mark: Recipient Completed',
    DOCUMENT_REMINDER_SENT: ':bell: Reminder Sent',
    TEMPLATE_CREATED: ':page_facing_up: Template Created',
    TEMPLATE_UPDATED: ':arrows_counterclockwise: Template Updated',
    TEMPLATE_DELETED: ':wastebasket: Template Deleted',
    TEMPLATE_USED: ':arrows_counterclockwise: Template Used',
  };

  const text = `${eventLabels[event] || event}\n*Document:* ${documentTitle}\n*Triggered by:* ${triggerUser}`;

  const blocks = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Document' },
          url: `${process.env.NEXT_PUBLIC_WEBAPP_URL || ''}/documents/${documentId}`,
          action_id: 'view_document',
        },
      ],
    },
  ];

  try {
    if (integration.incomingWebhookUrl) {
      await fetch(integration.incomingWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, blocks }),
      });
    } else if (integration.accessToken && integration.defaultChannelId) {
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${integration.accessToken}`,
        },
        body: JSON.stringify({
          channel: integration.defaultChannelId,
          text,
          blocks,
        }),
      });
    }
  } catch (error) {
    console.error('[Slack] Failed to send notification:', error);
  }
};
