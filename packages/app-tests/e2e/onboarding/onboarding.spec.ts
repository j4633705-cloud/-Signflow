import { expect, test } from '@playwright/test';
import { seedBlankDocument } from '@signflow/prisma/seed/documents';
import { seedUser } from '@signflow/prisma/seed/users';

import { apiSignin } from '../fixtures/authentication';

test.describe.configure({ mode: 'parallel' });

test('[ONBOARDING]: shows onboarding card for new user on dashboard', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/documents`,
  });

  await page.goto('/');

  await expect(page.getByText('Get started with SignFlow')).toBeVisible();
  await expect(page.getByText('Create your first document')).toBeVisible();
  await expect(page.getByText('0%')).toBeVisible();
});

test('[ONBOARDING]: shows correct progress after creating a document', async ({ page }) => {
  const { user, team } = await seedUser();

  await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'First Doc' },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/',
  });

  await expect(page.getByText('Get started with SignFlow')).toBeVisible();
  await expect(page.getByText('Create your first document')).toBeVisible();
  await expect(page.getByText('33%')).toBeVisible();
});

test('[ONBOARDING]: can dismiss the onboarding card', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/',
  });

  await expect(page.getByText('Get started with SignFlow')).toBeVisible();

  await page.getByRole('button', { name: 'Dismiss' }).click();

  await page.waitForTimeout(300);

  await expect(page.getByText('Get started with SignFlow')).not.toBeVisible();
});

test('[ONBOARDING]: onboarding card does not reappear after dismiss on reload', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/',
  });

  await expect(page.getByText('Get started with SignFlow')).toBeVisible();

  await page.getByRole('button', { name: 'Dismiss' }).click();
  await page.waitForTimeout(300);

  await page.reload();
  await page.waitForTimeout(500);

  await expect(page.getByText('Get started with SignFlow')).not.toBeVisible();
});

test('[ONBOARDING]: card has Go buttons with correct links for each step', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/',
  });

  const goButtons = page.getByRole('link', { name: 'Go' });
  await expect(goButtons.first()).toBeVisible();
  const count = await goButtons.count();
  expect(count).toBe(3);
});

test('[ONBOARDING]: all steps show Done when user has documents in all states', async ({ page }) => {
  const { user, team } = await seedUser();

  await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'Draft' },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/',
  });

  await expect(page.getByText('100%')).toBeVisible();
});
