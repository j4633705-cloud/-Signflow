import { getCookieDomain, useSecureCookies } from '@signflow/lib/constants/auth';
import { env } from '@signflow/lib/utils/env';
import { createCookieSessionStorage } from 'react-router';
import { createThemeSessionResolver } from 'remix-themes';

const themeSessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'theme',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secrets: [env('NEXTAUTH_SECRET', 'insecure-secret-do-not-care')],
    secure: useSecureCookies,
    domain: getCookieDomain(),
    maxAge: 60 * 60 * 24 * 365,
  },
});

export const themeSessionResolver = createThemeSessionResolver(themeSessionStorage);
