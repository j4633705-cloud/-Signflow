import { prisma } from '@signflow/prisma';

export const lookupTeamByDomain = async (hostname: string) => {
  const domain = hostname.replace(/^www\./, '').toLowerCase();

  const customDomain = await prisma.teamCustomDomain.findFirst({
    where: { domain, verified: true },
    include: {
      team: {
        include: {
          teamGlobalSettings: true,
          organisation: {
            include: {
              organisationGlobalSettings: true,
            },
          },
        },
      },
    },
  });

  if (!customDomain) {
    return null;
  }

  const orgSettings = customDomain.team.organisation.organisationGlobalSettings;
  const teamSettings = customDomain.team.teamGlobalSettings;

  const brandingEnabled = teamSettings.brandingEnabled ?? orgSettings.brandingEnabled;
  const brandingLogo = teamSettings.brandingLogo ?? orgSettings.brandingLogo;
  const brandingUrl = teamSettings.brandingUrl ?? orgSettings.brandingUrl;
  const brandingColors = teamSettings.brandingColors ?? orgSettings.brandingColors;
  const brandingCss = teamSettings.brandingCss ?? orgSettings.brandingCss;

  return {
    teamId: customDomain.team.id,
    teamUrl: customDomain.team.url,
    teamName: customDomain.team.name,
    domain: customDomain.domain,
    branding: {
      brandingEnabled,
      brandingLogo,
      brandingUrl,
      brandingColors: brandingColors as Record<string, string> | null,
      brandingCss,
    },
  };
};
