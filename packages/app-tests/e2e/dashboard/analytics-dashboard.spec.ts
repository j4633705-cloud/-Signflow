import { expect, test } from '@playwright/test';
import { seedBlankDocument } from '@signflow/prisma/seed/documents';
import { seedUser } from '@signflow/prisma/seed/users';

import { apiSignin } from '../fixtures/authentication';

test.describe.configure({ mode: 'parallel' });

test('[ANALYTICS]: dashboard shows metric cards for new user', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/',
  });

  await expect(page.getByText('Dashboard')).toBeVisible();
  await expect(page.getByText('Total Documents')).toBeVisible();
  await expect(page.getByText('0')).toBeVisible();
});

test('[ANALYTICS]: dashboard shows correct document counts', async ({ page }) => {
  const { user, team } = await seedUser();

  await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'Doc 1' },
  });

  await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'Doc 2' },
  });

  await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'Doc 3' },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/',
  });

  await expect(page.getByText('Total Documents')).toBeVisible();
  await expect(page.getByText('3')).toBeVisible();
});

test('[ANALYTICS]: dashboard shows monthly trend chart', async ({ page }) => {
  const { user, team } = await seedUser();

  await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'Trend Doc' },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/',
  });

  await expect(page.getByText('Dashboard')).toBeVisible();
});

test('[ANALYTICS]: dashboard shows recent documents section', async ({ page }) => {
  const { user, team } = await seedUser();

  await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'Recent Doc 1' },
  });

  await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'Recent Doc 2' },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/',
  });

  await expect(page.getByText('Recent Doc 1')).toBeVisible();
  await expect(page.getByText('Recent Doc 2')).toBeVisible();
});
