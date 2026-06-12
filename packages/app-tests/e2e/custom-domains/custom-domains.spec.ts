import { expect, test } from '@playwright/test';
import { prisma } from '@signflow/prisma';
import { seedUser } from '@signflow/prisma/seed/users';

import { apiSignin } from '../fixtures/authentication';
import { expectTextToBeVisible } from '../fixtures/generic';

test.describe.configure({ mode: 'parallel' });

test('[CUSTOM DOMAIN]: shows empty state for new team', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/domains`,
  });

  await expect(page.getByText('Custom Domains')).toBeVisible();
  await expect(page.getByText('No domains added yet')).toBeVisible();
});

test('[CUSTOM DOMAIN]: add a new domain', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/domains`,
  });

  const domainName = `sign-${Date.now()}.example.com`;

  await page.locator('#domain').fill(domainName);
  await page.getByRole('button', { name: 'Add' }).click();

  await expectTextToBeVisible(page, 'Domain added');
  await expect(page.getByText(domainName)).toBeVisible();
  await expect(page.getByText('Pending')).toBeVisible();

  const dbDomain = await prisma.teamCustomDomain.findFirstOrThrow({
    where: { teamId: team.id },
  });

  expect(dbDomain.domain).toBe(domainName);
  expect(dbDomain.verified).toBe(false);
  expect(dbDomain.verificationToken).toBeTruthy();
  expect(dbDomain.verificationToken).toMatch(/^signflow-verify=/);
});

test('[CUSTOM DOMAIN]: shows TXT record for pending domain', async ({ page }) => {
  const { user, team } = await seedUser();

  const domainName = `verify-${Date.now()}.example.com`;

  await prisma.teamCustomDomain.create({
    data: {
      domain: domainName,
      verificationToken: 'signflow-verify=abc123token',
      verified: false,
      teamId: team.id,
    },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/domains`,
  });

  await expect(page.getByText(domainName)).toBeVisible();
  await expect(page.getByText('signflow-verify=abc123token')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verify' })).toBeVisible();
});

test('[CUSTOM DOMAIN]: shows verified badge for verified domain', async ({ page }) => {
  const { user, team } = await seedUser();

  const domainName = `verified-${Date.now()}.example.com`;

  await prisma.teamCustomDomain.create({
    data: {
      domain: domainName,
      verificationToken: 'signflow-verify=verifiedtoken',
      verified: true,
      teamId: team.id,
    },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/domains`,
  });

  await expect(page.getByText(domainName)).toBeVisible();
  await expect(page.getByText('Verified')).toBeVisible();
});

test('[CUSTOM DOMAIN]: remove a domain', async ({ page }) => {
  const { user, team } = await seedUser();

  const domainName = `remove-${Date.now()}.example.com`;

  await prisma.teamCustomDomain.create({
    data: {
      domain: domainName,
      verificationToken: 'signflow-verify=removetoken',
      verified: false,
      teamId: team.id,
    },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/domains`,
  });

  await expect(page.getByText(domainName)).toBeVisible();

  const removeButton = page.locator('button[aria-label="Remove"]');
  await removeButton.click();

  await expect(page.getByText(domainName)).not.toBeVisible();

  const dbCount = await prisma.teamCustomDomain.count({ where: { domain: domainName } });
  expect(dbCount).toBe(0);
});

test('[CUSTOM DOMAIN]: validates domain format', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/domains`,
  });

  await page.locator('#domain').fill('invalid-domain');
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.getByText('No domains added yet')).toBeVisible();
});
