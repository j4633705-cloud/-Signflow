import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useOptionalSession } from '@signflow/lib/client-only/providers/session';
import { lookupTeamByDomain } from '@signflow/lib/server-only/custom-domains/lookup-team-by-domain';
import { cn } from '@signflow/ui/lib/utils';
import { Button } from '@signflow/ui/primitives/button';
import { ChevronLeft } from 'lucide-react';
import { isRouteErrorResponse, Link, Outlet, useRouteLoaderData } from 'react-router';
import { Header as AuthenticatedHeader } from '~/components/general/app-header';
import { GenericErrorLayout } from '~/components/general/generic-error-layout';
import { RecipientBranding, type RecipientBrandingPayload } from '~/components/general/recipient-branding';
import { useCspNonce } from '~/utils/nonce';
import type { Route } from './+types/_layout';

export function meta() {
  return [
    { title: i18n._(msg`Sign Document - signflow`) },
    { name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const hostname = new URL(request.url).hostname;

  const domainInfo = await lookupTeamByDomain(hostname);

  if (!domainInfo || !domainInfo.branding.brandingEnabled) {
    return { customDomainBranding: null as RecipientBrandingPayload | null };
  }

  const { branding } = domainInfo;

  const customDomainBranding: RecipientBrandingPayload = {
    allowCustomBranding: true,
    colors: branding.brandingColors as RecipientBrandingPayload['colors'],
    css: branding.brandingCss,
  };

  return { customDomainBranding };
}

/**
 * A layout to handle scenarios where the user is a recipient of a given resource
 * where we do not care whether they are authenticated or not.
 *
 * Such as direct template access, or signing.
 */
export default function RecipientLayout({ matches, loaderData }: Route.ComponentProps) {
  const { sessionData } = useOptionalSession();
  const cspNonce = useCspNonce();

  const { customDomainBranding } = loaderData;

  // Hide the header for signing routes.
  const hideHeader = matches.some(
    (match) =>
      match?.id === 'routes/_recipient+/sign.$token+/_index' || match?.id === 'routes/_recipient+/d.$token+/_index',
  );

  return (
    <div className="min-h-screen">
      {customDomainBranding && <RecipientBranding branding={customDomainBranding} cspNonce={cspNonce} />}

      {!hideHeader && sessionData?.user && <AuthenticatedHeader />}

      <main
        className={cn({
          'mt-8 mb-8 px-4 md:mt-12 md:mb-12 md:px-8': !hideHeader,
        })}
      >
        <Outlet />
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const errorCode = isRouteErrorResponse(error) ? error.status : 500;

  return (
    <GenericErrorLayout
      errorCode={errorCode}
      secondaryButton={null}
      primaryButton={
        <Button asChild className="w-32">
          <Link to="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            <Trans>Go Back</Trans>
          </Link>
        </Button>
      }
    />
  );
}

export function useCustomDomainBranding() {
  const data = useRouteLoaderData<typeof loader>('routes/_recipient+/_layout');
  return data?.customDomainBranding ?? null;
}
