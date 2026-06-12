import { sValidator } from '@hono/standard-validator';
import { UserSecurityAuditLogType } from '@prisma/client';
import { NEXT_PUBLIC_WEBAPP_URL } from '@signflow/lib/constants/app';
import { AppError, AppErrorCode } from '@signflow/lib/errors/app-error';
import { env } from '@signflow/lib/utils/env';
import { prisma } from '@signflow/prisma';
import { Hono } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';

import { sessionCookieOptions } from '../lib/session/session-cookies';
import { getSession } from '../lib/utils/get-session';
import type { HonoAuthContext } from '../types/context';

const ZAuthorizeSlackSchema = z.object({
  redirectPath: z.string().optional(),
  teamId: z.number(),
});

const oauthCookieMaxAge = 60 * 10;

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateRandomString(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const slackRoute = new Hono<HonoAuthContext>()
  .post('/oauth/authorize/slack', sValidator('json', ZAuthorizeSlackSchema), async (c) => {
    const { redirectPath, teamId } = c.req.valid('json');

    await getSession(c);

    const clientId = env('NEXT_PRIVATE_SLACK_CLIENT_ID');
    const clientSecret = env('NEXT_PRIVATE_SLACK_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new AppError(AppErrorCode.NOT_SETUP);
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { url: true },
    });

    if (!team) {
      throw new AppError(AppErrorCode.NOT_FOUND, { message: 'Team not found' });
    }

    const state = generateRandomString();
    const codeVerifier = generateRandomString();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const redirectUri = `${NEXT_PUBLIC_WEBAPP_URL()}/api/auth/callback/slack`;

    const slackUrl = new URL('https://slack.com/oauth/v2/authorize');
    slackUrl.searchParams.set('client_id', clientId);
    slackUrl.searchParams.set('scope', 'incoming-webhook,chat:write,channels:read,team:read');
    slackUrl.searchParams.set('redirect_uri', redirectUri);
    slackUrl.searchParams.set('state', state);
    slackUrl.searchParams.set('code_challenge', codeChallenge);
    slackUrl.searchParams.set('code_challenge_method', 'S256');

    setCookie(c, 'slack_oauth_state', state, {
      ...sessionCookieOptions,
      sameSite: 'lax',
      maxAge: oauthCookieMaxAge,
    });

    setCookie(c, 'slack_code_verifier', codeVerifier, {
      ...sessionCookieOptions,
      sameSite: 'lax',
      maxAge: oauthCookieMaxAge,
    });

    setCookie(c, 'slack_team_id', String(teamId), {
      ...sessionCookieOptions,
      sameSite: 'lax',
      maxAge: oauthCookieMaxAge,
    });

    setCookie(c, 'slack_team_url', team.url, {
      ...sessionCookieOptions,
      sameSite: 'lax',
      maxAge: oauthCookieMaxAge,
    });

    if (redirectPath) {
      setCookie(c, 'slack_redirect_path', `${state} ${redirectPath}`, {
        ...sessionCookieOptions,
        sameSite: 'lax',
        maxAge: oauthCookieMaxAge,
      });
    }

    return c.json({
      redirectUrl: slackUrl.toString(),
    });
  })

  .get('/callback/slack', async (c) => {
    const requestMeta = c.get('requestMetadata');

    const { user } = await getSession(c);

    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');

    if (error) {
      throw new AppError(AppErrorCode.INVALID_REQUEST, {
        message: `Slack OAuth error: ${error}`,
      });
    }

    const storedState = deleteCookie(c, 'slack_oauth_state');
    const storedCodeVerifier = deleteCookie(c, 'slack_code_verifier');
    const storedTeamId = deleteCookie(c, 'slack_team_id');
    const storedTeamUrl = deleteCookie(c, 'slack_team_url');

    if (!code || !storedState || state !== storedState || !storedCodeVerifier || !storedTeamId) {
      const errorUrl = storedTeamUrl ? `/t/${storedTeamUrl}/settings/slack?error=invalid_state` : '/';

      return c.redirect(errorUrl, 302);
    }

    const clientId = env('NEXT_PRIVATE_SLACK_CLIENT_ID');
    const clientSecret = env('NEXT_PRIVATE_SLACK_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new AppError(AppErrorCode.NOT_SETUP);
    }

    const redirectUri = `${NEXT_PUBLIC_WEBAPP_URL()}/api/auth/callback/slack`;

    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      ok: boolean;
      error?: string;
      access_token: string;
      bot_user_id?: string;
      team?: {
        name?: string;
        id?: string;
      };
      incoming_webhook?: {
        url?: string;
        channel?: string;
        channel_id?: string;
      };
    };

    if (!tokenData.ok) {
      const errorUrl = storedTeamUrl ? `/t/${storedTeamUrl}/settings/slack?error=token_exchange_failed` : '/';

      return c.redirect(errorUrl, 302);
    }

    const teamId = Number(storedTeamId);

    await prisma.teamSlackIntegration.upsert({
      where: { teamId },
      create: {
        teamId,
        accessToken: tokenData.access_token,
        botUserId: tokenData.bot_user_id,
        teamName: tokenData.team?.name,
        slackTeamId: tokenData.team?.id,
        incomingWebhookUrl: tokenData.incoming_webhook?.url,
        defaultChannelId: tokenData.incoming_webhook?.channel_id,
        defaultChannelName: tokenData.incoming_webhook?.channel,
        enabled: true,
        eventTriggers: [],
      },
      update: {
        accessToken: tokenData.access_token,
        botUserId: tokenData.bot_user_id,
        teamName: tokenData.team?.name,
        slackTeamId: tokenData.team?.id,
        incomingWebhookUrl: tokenData.incoming_webhook?.url,
        defaultChannelId: tokenData.incoming_webhook?.channel_id,
        defaultChannelName: tokenData.incoming_webhook?.channel,
        enabled: true,
      },
    });

    await prisma.userSecurityAuditLog.create({
      data: {
        userId: user.id,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        type: UserSecurityAuditLogType.ACCOUNT_SSO_LINK,
      },
    });

    const teamUrl =
      storedTeamUrl ??
      (
        await prisma.team.findUnique({
          where: { id: teamId },
          select: { url: true },
        })
      )?.url;

    return c.redirect(`/t/${teamUrl ?? storedTeamId}/settings/slack`, 302);
  });
