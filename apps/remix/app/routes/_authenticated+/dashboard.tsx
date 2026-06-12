import { msg } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { getSession } from '@signflow/auth/server/lib/utils/get-session';
import { useSession } from '@signflow/lib/client-only/providers/session';
import { ORGANISATION_MEMBER_ROLE_MAP } from '@signflow/lib/constants/organisations-translations';
import { TEAM_MEMBER_ROLE_MAP } from '@signflow/lib/constants/teams-translations';
import {
  getUserDocumentStats,
  getUserMonthlyDocumentTrend,
} from '@signflow/lib/server-only/user/get-user-document-stats';
import { formatAvatarUrl } from '@signflow/lib/utils/avatars';
import { canExecuteOrganisationAction } from '@signflow/lib/utils/organisations';
import { canExecuteTeamAction } from '@signflow/lib/utils/teams';
import { prisma } from '@signflow/prisma';
import { Avatar, AvatarFallback, AvatarImage } from '@signflow/ui/primitives/avatar';
import { Button } from '@signflow/ui/primitives/button';
import { Card, CardContent, CardHeader, CardTitle } from '@signflow/ui/primitives/card';
import { ScrollArea, ScrollBar } from '@signflow/ui/primitives/scroll-area';
import {
  Building2Icon,
  FileCheckIcon,
  FileIcon,
  FileXIcon,
  InboxIcon,
  PenToolIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CardMetric } from '~/components/general/metric-card';
import { OnboardingCard } from '~/components/general/onboarding-card';
import { OrganisationInvitations } from '~/components/general/organisations/organisation-invitations';
import { InboxTable } from '~/components/tables/inbox-table';
import { appMetaTags } from '~/utils/meta';
import type { Route } from './+types/dashboard';

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await getSession(request);

  const [documentStats, monthlyTrend, recentDocuments] = await Promise.all([
    getUserDocumentStats(user.id),
    getUserMonthlyDocumentTrend(user.id),
    prisma.envelope.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    documentStats,
    monthlyTrend,
    recentDocuments,
  };
}

export function meta() {
  return appMetaTags(msg`Dashboard`);
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { t } = useLingui();
  const { documentStats, monthlyTrend, recentDocuments } = loaderData;
  const { user, organisations } = useSession();

  const teams = useMemo(() => {
    return organisations.flatMap((org) =>
      org.teams.map((team) => ({
        ...team,
        organisation: {
          ...org,
          teams: undefined,
        },
      })),
    );
  }, [organisations]);

  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('onboarding_dismissed') === 'true';
    }
    return false;
  });

  const handleOnboardingDismiss = useCallback(() => {
    localStorage.setItem('onboarding_dismissed', 'true');
    setOnboardingDismissed(true);
  }, []);

  const teamUrl = teams[0]?.url || '';
  const allStepsComplete = documentStats.TOTAL > 0 && documentStats.PENDING > 0 && documentStats.COMPLETED > 0;

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
      <div className="container">
        <div className="mb-8">
          <h1 className="font-bold text-3xl">
            <Trans>Dashboard</Trans>
          </h1>
          <p className="mt-1 text-muted-foreground">
            <Trans>Welcome back! Here's an overview of your account.</Trans>
          </p>

          <OrganisationInvitations className="mt-4" />
        </div>

        {!onboardingDismissed && !allStepsComplete && (
          <OnboardingCard
            documentCount={documentStats.TOTAL}
            pendingCount={documentStats.PENDING}
            completedCount={documentStats.COMPLETED}
            teamUrl={teamUrl}
            onDismiss={handleOnboardingDismiss}
          />
        )}

        {/* Document Analytics */}
        {documentStats.TOTAL > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-xl">
                <Trans>Document Analytics</Trans>
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardMetric icon={FileIcon} label={t`Total Documents`} value={documentStats.TOTAL} />
              <CardMetric icon={PenToolIcon} label={t`Pending`} value={documentStats.PENDING} />
              <CardMetric icon={FileCheckIcon} label={t`Completed`} value={documentStats.COMPLETED} />
              <CardMetric icon={FileXIcon} label={t`Rejected`} value={documentStats.REJECTED} />
            </div>

            {monthlyTrend.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="font-semibold text-lg">
                    <Trans>Monthly Trend</Trans>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                        <YAxis allowDecimals={false} className="text-muted-foreground text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Documents" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Orgs and Teams sections (unchanged from original) */}
        {organisations.length === 0 && (
          <div className="mt-6 mb-12 flex flex-col items-center justify-center rounded-lg border py-32">
            <Building2Icon className="h-10 w-10" />

            <div className="mt-2 flex flex-col items-center gap-0.5">
              <p className="font-semibold">
                <Trans>No organisations found</Trans>
              </p>
              <p className="text-muted-foreground text-sm">
                <Trans>Create an organisation to get started.</Trans>
              </p>
            </div>

            <Button asChild className="mt-4" variant="outline">
              <Link to="/settings/organisations?action=add-organisation">
                <Trans>Create organisation</Trans>
              </Link>
            </Button>
          </div>
        )}

        {organisations.length > 1 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2Icon className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-xl">
                  <Trans>Organisations</Trans>
                </h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {organisations.map((org) => (
                <div key={org.id} className="group relative">
                  <Link to={`/o/${org.url}`}>
                    <Card className="h-full border pr-6 transition-all hover:bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-solid">
                            {org.avatarImageId && <AvatarImage src={formatAvatarUrl(org.avatarImageId)} />}
                            <AvatarFallback className="text-gray-400 text-sm">
                              {org.name.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <h3 className="font-medium">{org.name}</h3>
                            <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
                              <div className="flex items-center gap-1">
                                <UsersIcon className="h-3 w-3" />
                                <span>
                                  {org.ownerUserId === user.id
                                    ? t`Owner`
                                    : t(ORGANISATION_MEMBER_ROLE_MAP[org.currentOrganisationRole])}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Building2Icon className="h-3 w-3" />
                                <span>
                                  <Plural
                                    value={org.teams.length}
                                    one={<Trans># team</Trans>}
                                    other={<Trans># teams</Trans>}
                                  />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {canExecuteOrganisationAction('MANAGE_ORGANISATION', org.currentOrganisationRole) && (
                    <div className="absolute top-4 right-4 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <Link to={`/o/${org.url}/settings`}>
                        <SettingsIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {teams.length >= 1 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-xl">
                  <Trans>Teams</Trans>
                </h2>
              </div>
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex gap-4">
                {teams.map((team) => (
                  <div key={team.id} className="group relative">
                    <Link to={`/t/${team.url}`}>
                      <Card className="w-[350px] shrink-0 border transition-all hover:bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-solid">
                              {team.avatarImageId && <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />}
                              <AvatarFallback className="text-gray-400 text-sm">
                                {team.name.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <h3 className="font-medium">{team.name}</h3>
                              <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
                                <div className="flex items-center gap-1">
                                  <UsersIcon className="h-3 w-3" />
                                  {team.organisation.ownerUserId === user.id
                                    ? t`Owner`
                                    : t(TEAM_MEMBER_ROLE_MAP[team.currentTeamRole])}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Building2Icon className="h-3 w-3" />
                                  <span className="truncate">{team.organisation.name}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 text-muted-foreground text-xs">
                            <Trans>Joined {DateTime.fromJSDate(team.createdAt).toRelative({ style: 'short' })}</Trans>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    {canExecuteTeamAction('MANAGE_TEAM', team.currentTeamRole) && (
                      <div className="absolute top-4 right-4 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Link to={`/t/${team.url}/settings`}>
                          <SettingsIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <InboxIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-xl">
                <Trans>Personal Inbox</Trans>
              </h2>
            </div>
          </div>

          <InboxTable />
        </div>
      </div>
    </div>
  );
}
