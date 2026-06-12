import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { trpc } from '@signflow/trpc/react';
import { Badge } from '@signflow/ui/primitives/badge';
import { Button } from '@signflow/ui/primitives/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@signflow/ui/primitives/card';
import { Input } from '@signflow/ui/primitives/input';
import { Label } from '@signflow/ui/primitives/label';
import { useToast } from '@signflow/ui/primitives/use-toast';
import { CheckIcon, CopyIcon, GlobeIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SettingsHeader } from '~/components/general/settings-header';
import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Custom Domains`);
}

const ZAddDomainFormSchema = z.object({
  domain: z
    .string()
    .min(1)
    .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i, 'Invalid domain format'),
});

type AddDomainFormData = z.infer<typeof ZAddDomainFormSchema>;

export default function CustomDomainsSettingsPage() {
  const { t } = useLingui();
  const { toast } = useToast();
  const team = useCurrentTeam();

  const { data: domains, isLoading, refetch } = trpc.customDomain.list.useQuery({ teamId: team.id });

  const addMutation = trpc.customDomain.add.useMutation({
    onSuccess: () => {
      refetch();
      form.reset();
      toast({
        title: t`Domain added`,
        description: t`Add the TXT record to your DNS to verify ownership.`,
      });
    },
    onError: (err) => {
      toast({
        title: t`Failed to add domain`,
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const verifyMutation = trpc.customDomain.verify.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        title: t`Domain verified`,
        description: t`Your domain has been verified successfully.`,
      });
    },
    onError: (err) => {
      toast({
        title: t`Verification failed`,
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const removeMutation = trpc.customDomain.remove.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        title: t`Domain removed`,
        description: t`The domain has been removed.`,
      });
    },
    onError: (err) => {
      toast({
        title: t`Failed to remove domain`,
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const form = useForm<AddDomainFormData>({
    resolver: zodResolver(ZAddDomainFormSchema),
    defaultValues: { domain: '' },
  });

  const onSubmit = useCallback(
    (data: AddDomainFormData) => {
      addMutation.mutate({ domain: data.domain.toLowerCase() });
    },
    [addMutation],
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyTxtRecord = useCallback(
    async (domainId: string, txtValue: string) => {
      try {
        await navigator.clipboard.writeText(txtValue);
        setCopiedId(domainId);
        toast({ title: t`Copied to clipboard` });
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        toast({
          title: t`Failed to copy`,
          variant: 'destructive',
        });
      }
    },
    [t, toast],
  );

  if (isLoading) {
    return (
      <div>
        <SettingsHeader title={t`Custom Domains`} subtitle={t`Loading...`} />
      </div>
    );
  }

  return (
    <div>
      <SettingsHeader title={t`Custom Domains`} subtitle={t`Configure custom domains for your team's signing pages.`} />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>
            <Trans>Add Domain</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Enter a domain you own to use it for your signing pages.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={addMutation.isLoading} className="flex items-end gap-x-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="domain">
                  <Trans>Domain</Trans>
                </Label>
                <Input id="domain" placeholder="sign.yourcompany.com" {...form.register('domain')} />
                {form.formState.errors.domain && (
                  <p className="text-destructive text-sm">{form.formState.errors.domain.message}</p>
                )}
              </div>
              <Button type="submit" loading={addMutation.isLoading}>
                <PlusIcon className="mr-2 h-4 w-4" />
                <Trans>Add</Trans>
              </Button>
            </fieldset>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4">
        <h3 className="font-medium text-lg">
          <Trans>Registered Domains</Trans>
        </h3>

        {(!domains || domains.length === 0) && (
          <Card className="max-w-xl">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-y-2 text-muted-foreground/60">
                <GlobeIcon className="h-8 w-8" />
                <p className="text-sm">
                  <Trans>No domains added yet. Add your first domain above.</Trans>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {domains?.map((domain) => {
          const txtValue = `signflow-verify=${domain.verificationToken}`;

          return (
            <Card key={domain.id} className="max-w-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-mono text-base">{domain.domain}</span>
                  <Badge variant={domain.verified ? 'default' : 'warning'} size="small">
                    {domain.verified ? <Trans>Verified</Trans> : <Trans>Pending</Trans>}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!domain.verified && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">
                      <Trans>TXT Record</Trans>
                    </Label>
                    <div className="flex items-center gap-x-2">
                      <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">{txtValue}</code>
                      <Button variant="outline" size="sm" onClick={() => handleCopyTxtRecord(domain.id, txtValue)}>
                        {copiedId === domain.id ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      <Trans>Add this TXT record to your domain's DNS settings to verify ownership.</Trans>
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="gap-x-2">
                {!domain.verified && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => verifyMutation.mutate({ id: domain.id })}
                    loading={verifyMutation.isLoading}
                  >
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    <Trans>Verify</Trans>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeMutation.mutate({ id: domain.id })}
                  loading={removeMutation.isLoading}
                >
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  <Trans>Remove</Trans>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
