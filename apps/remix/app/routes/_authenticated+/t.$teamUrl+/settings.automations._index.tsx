import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { trpc } from '@signflow/trpc/react';
import { Badge } from '@signflow/ui/primitives/badge';
import { Button } from '@signflow/ui/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@signflow/ui/primitives/card';
import { Switch } from '@signflow/ui/primitives/switch';
import { PlusIcon, ZapIcon } from 'lucide-react';
import { Link } from 'react-router';

import { SettingsHeader } from '~/components/general/settings-header';
import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Automations`);
}

export default function AutomationsListPage() {
  const { t } = useLingui();
  const team = useCurrentTeam();

  const { data: automations, isLoading, refetch } = trpc.automation.list.useQuery({ teamId: team.id });
  const updateMutation = trpc.automation.update.useMutation({ onSuccess: () => refetch() });

  const triggerLabels: Record<string, string> = {
    DOCUMENT_COMPLETED: 'Document Completed',
    DOCUMENT_SIGNED: 'Document Signed',
    DOCUMENT_REJECTED: 'Document Rejected',
    ALL_SIGNED: 'All Recipients Signed',
  };

  const actionLabels: Record<string, string> = {
    SEND_EMAIL: 'Send Email',
    SEND_SLACK: 'Send Slack Message',
    SEND_WEBHOOK: 'Send Webhook',
  };

  if (isLoading) {
    return (
      <div>
        <SettingsHeader title={t`Automations`} subtitle={t`Loading...`} />
      </div>
    );
  }

  return (
    <div>
      <SettingsHeader title={t`Automations`} subtitle={t`Create automated workflows for your documents.`}>
        <Button asChild>
          <Link to={`/t/${team.url}/settings/automations/new`}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans>New Automation</Trans>
          </Link>
        </Button>
      </SettingsHeader>

      {!automations || automations.length === 0 ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>
              <Trans>No Automations Yet</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Create your first automation to automatically perform actions when document events happen.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={`/t/${team.url}/settings/automations/new`}>
                <PlusIcon className="mr-2 h-4 w-4" />
                <Trans>Create Automation</Trans>
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => (
            <Card key={automation.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ZapIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{automation.name}</CardTitle>
                      {automation.description && <CardDescription>{automation.description}</CardDescription>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={automation.enabled ? 'default' : 'neutral'} size="small">
                      {automation.enabled ? t`Enabled` : t`Disabled`}
                    </Badge>
                    <Switch
                      checked={automation.enabled}
                      onCheckedChange={(checked) => {
                        updateMutation.mutate({
                          id: automation.id,
                          name: automation.name,
                          enabled: checked,
                          triggerType: automation.trigger?.type ?? 'DOCUMENT_COMPLETED',
                          triggerConfig: automation.trigger?.config ?? undefined,
                          actions: automation.actions.map((a) => ({
                            type: a.type,
                            config: a.config as Record<string, string | undefined>,
                            order: a.order,
                          })),
                        });
                      }}
                    />
                    <Link to={`/t/${team.url}/settings/automations/${automation.id}`}>
                      <Button variant="outline" size="sm">
                        <Trans>Edit</Trans>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <span>
                    {t`Trigger`}:{' '}
                    <strong>{triggerLabels[automation.trigger?.type ?? ''] || automation.trigger?.type}</strong>
                  </span>
                  <span className="mx-2">→</span>
                  <span>
                    {t`Actions`}: <strong>{automation.actions.map((a) => actionLabels[a.type]).join(', ')}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
