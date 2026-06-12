import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { trpc } from '@signflow/trpc/react';
import { Badge } from '@signflow/ui/primitives/badge';
import { Button } from '@signflow/ui/primitives/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@signflow/ui/primitives/card';
import { Checkbox } from '@signflow/ui/primitives/checkbox';
import { Label } from '@signflow/ui/primitives/label';
import { Switch } from '@signflow/ui/primitives/switch';
import { useCallback, useState } from 'react';

import { SettingsHeader } from '~/components/general/settings-header';
import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Slack Integration`);
}

export default function SlackSettingsPage() {
  const { t } = useLingui();

  const team = useCurrentTeam();

  const { data: integration, isLoading, refetch } = trpc.slack.get.useQuery({ teamId: team.id });

  const updateMutation = trpc.slack.update.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.slack.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const [selectedEvents, setSelectedEvents] = useState<string[]>(integration?.eventTriggers ?? []);

  const handleConnectSlack = useCallback(async () => {
    const response = await fetch('/api/auth/oauth/authorize/slack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: team.id }),
    });

    if (!response.ok) {
      return;
    }

    const { redirectUrl } = (await response.json()) as { redirectUrl: string };

    window.location.href = redirectUrl;
  }, [team.id]);

  if (isLoading) {
    return (
      <div>
        <SettingsHeader title={t`Slack Integration`} subtitle={t`Loading...`} />
      </div>
    );
  }

  const allEvents = [
    'DOCUMENT_CREATED',
    'DOCUMENT_SENT',
    'DOCUMENT_OPENED',
    'DOCUMENT_SIGNED',
    'DOCUMENT_COMPLETED',
    'DOCUMENT_REJECTED',
    'DOCUMENT_CANCELLED',
    'RECIPIENT_EXPIRED',
    'DOCUMENT_RECIPIENT_COMPLETED',
    'DOCUMENT_REMINDER_SENT',
    'TEMPLATE_CREATED',
    'TEMPLATE_UPDATED',
    'TEMPLATE_DELETED',
    'TEMPLATE_USED',
  ] as const;

  const eventLabels: Record<string, string> = {
    DOCUMENT_CREATED: 'Document Created',
    DOCUMENT_SENT: 'Document Sent',
    DOCUMENT_OPENED: 'Document Opened',
    DOCUMENT_SIGNED: 'Document Signed',
    DOCUMENT_COMPLETED: 'Document Completed',
    DOCUMENT_REJECTED: 'Document Rejected',
    DOCUMENT_CANCELLED: 'Document Cancelled',
    RECIPIENT_EXPIRED: 'Recipient Expired',
    DOCUMENT_RECIPIENT_COMPLETED: 'Recipient Completed',
    DOCUMENT_REMINDER_SENT: 'Reminder Sent',
    TEMPLATE_CREATED: 'Template Created',
    TEMPLATE_UPDATED: 'Template Updated',
    TEMPLATE_DELETED: 'Template Deleted',
    TEMPLATE_USED: 'Template Used',
  };

  return (
    <div>
      <SettingsHeader
        title={t`Slack Integration`}
        subtitle={t`Connect your Slack workspace to receive document notifications.`}
      />

      {!integration ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>
              <Trans>Not Connected</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Connect your Slack workspace to start receiving document event notifications in a channel.</Trans>
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleConnectSlack}>
              <Trans>Connect to Slack</Trans>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="max-w-xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  <Trans>Connected Workspace</Trans>
                </span>
                <Badge variant={integration.enabled ? 'default' : 'neutral'} size="small">
                  {integration.enabled ? <Trans>Enabled</Trans> : <Trans>Disabled</Trans>}
                </Badge>
              </CardTitle>
              <CardDescription>
                <Trans>Workspace:</Trans> {integration.teamName}
                {integration.defaultChannelName && (
                  <>
                    <br />
                    <Trans>Channel:</Trans> #{integration.defaultChannelName}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-x-4">
                <Switch
                  id="slack-enabled"
                  checked={integration.enabled}
                  onCheckedChange={(checked) => {
                    updateMutation.mutate({ id: integration.id, enabled: checked });
                  }}
                />
                <Label htmlFor="slack-enabled">
                  <Trans>Enable Slack Notifications</Trans>
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Notification Events</Trans>
              </CardTitle>
              <CardDescription>
                <Trans>Select which events should trigger Slack notifications.</Trans>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {allEvents.map((event) => (
                  <div key={event} className="flex items-center gap-x-3">
                    <Checkbox
                      id={`event-${event}`}
                      checked={integration.eventTriggers.includes(event)}
                      onCheckedChange={(checked) => {
                        const newEvents = checked
                          ? [...integration.eventTriggers, event]
                          : integration.eventTriggers.filter((e: string) => e !== event);

                        setSelectedEvents(newEvents);
                        updateMutation.mutate({ id: integration.id, eventTriggers: newEvents });
                      }}
                    />
                    <Label htmlFor={`event-${event}`} className="text-sm">
                      {eventLabels[event] || event}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Disconnect</Trans>
              </CardTitle>
              <CardDescription>
                <Trans>Disconnecting will remove the integration and revoke Slack access.</Trans>
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate({ id: integration.id })}
                loading={deleteMutation.isLoading}
              >
                <Trans>Disconnect</Trans>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
