import type { AutomationAction } from '@prisma/client';
import { prisma } from '@signflow/prisma';

type ExecuteAutomationOptions = {
  event: string;
  teamId: number;
  documentId: string;
  documentTitle: string;
  triggerUser: string;
};

const executeAction = async (
  action: AutomationAction,
  context: { teamId: number; documentId: string; documentTitle: string; triggerUser: string },
) => {
  const config = action.config as Record<string, string | undefined>;

  switch (action.type) {
    case 'SEND_EMAIL': {
      if (!config.email) {
        return;
      }

      const interpolate = (text: string) => text.replace(/{{documentTitle}}/g, context.documentTitle);

      try {
        const { sendMail } = await import('@signflow/email/lib/mailer');
        await sendMail({
          to: config.email,
          subject: interpolate(config.subject || 'Document Notification'),
          html: interpolate(config.body || '').replace(/\n/g, '<br/>'),
        });
      } catch (error) {
        console.error('[Automation] SEND_EMAIL failed:', error);
      }
      break;
    }

    case 'SEND_SLACK': {
      if (!config.message) {
        return;
      }

      const message = (config.message || `*Document:* ${context.documentTitle}`)
        .replace(/{{documentTitle}}/g, context.documentTitle)
        .replace(/{{triggerUser}}/g, context.triggerUser);

      try {
        const integration = await prisma.teamSlackIntegration.findFirst({
          where: { teamId: context.teamId, enabled: true },
        });

        if (integration?.accessToken) {
          const channel = config.channel || integration.defaultChannelId || integration.defaultChannelName;
          if (!channel) {
            return;
          }

          await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Authorization: `Bearer ${integration.accessToken}`,
            },
            body: JSON.stringify({
              channel,
              text: message,
              blocks: [
                {
                  type: 'section',
                  text: { type: 'mrkdwn', text: message },
                },
              ],
            }),
          });
        }
      } catch (error) {
        console.error('[Automation] SEND_SLACK failed:', error);
      }
      break;
    }

    case 'SEND_WEBHOOK': {
      if (!config.url) {
        return;
      }

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(config.headers ? (JSON.parse(config.headers) as Record<string, string>) : {}),
        };

        await fetch(config.url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: 'automation.triggered',
            documentId: context.documentId,
            documentTitle: context.documentTitle,
            triggeredBy: context.triggerUser,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('[Automation] SEND_WEBHOOK failed:', error);
      }
      break;
    }
  }
};

export const executeAutomations = async ({
  event,
  teamId,
  documentId,
  documentTitle,
  triggerUser,
}: ExecuteAutomationOptions) => {
  if (!event.startsWith('DOCUMENT_')) {
    return;
  }

  const triggerMapping: Record<string, string> = {
    DOCUMENT_COMPLETED: 'DOCUMENT_COMPLETED',
    DOCUMENT_SIGNED: 'DOCUMENT_SIGNED',
    DOCUMENT_REJECTED: 'DOCUMENT_REJECTED',
  };

  const triggerType = triggerMapping[event];
  if (!triggerType) {
    return;
  }

  const automations = await prisma.automation.findMany({
    where: {
      teamId,
      enabled: true,
      trigger: { type: triggerType },
    },
    include: {
      trigger: true,
      actions: { orderBy: { order: 'asc' } },
    },
  });

  if (automations.length === 0) {
    return;
  }

  await Promise.allSettled(
    automations.map(async (automation) => {
      if (!automation.trigger) {
        return;
      }

      for (const action of automation.actions) {
        try {
          await executeAction(action, { teamId, documentId, documentTitle, triggerUser });
        } catch (error) {
          console.error(`[Automation] Failed to execute action ${action.id}:`, error);
        }
      }
    }),
  );
};
