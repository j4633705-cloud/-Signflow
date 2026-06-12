import { expect, test } from '@playwright/test';
import { WebhookTriggerEvents } from '@prisma/client';
import { prisma } from '@signflow/prisma';
import { seedUser } from '@signflow/prisma/seed/users';

import { apiSignin } from '../fixtures/authentication';

test.describe.configure({ mode: 'parallel' });

test('[SLACK]: shows not connected state for new team', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/slack`,
  });

  await expect(page.getByText('Slack Integration')).toBeVisible();
  await expect(page.getByText('Not Connected')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect to Slack' })).toBeVisible();
});

test('[SLACK]: shows connected workspace when integration exists', async ({ page }) => {
  const { user, team } = await seedUser();

  await prisma.teamSlackIntegration.create({
    data: {
      teamId: team.id,
      accessToken: 'xoxb-test-token',
      teamName: 'Test Workspace',
      defaultChannelName: '#general',
      enabled: true,
      eventTriggers: [WebhookTriggerEvents.DOCUMENT_CREATED, WebhookTriggerEvents.DOCUMENT_SIGNED],
    },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/slack`,
  });

  await expect(page.getByText('Slack Integration')).toBeVisible();
  await expect(page.getByText('Test Workspace')).toBeVisible();
  await expect(page.getByText('#general')).toBeVisible();
  await expect(page.getByText('Connected Workspace')).toBeVisible();
});

test('[SLACK]: toggles slack notifications', async ({ page }) => {
  const { user, team } = await seedUser();

  await prisma.teamSlackIntegration.create({
    data: {
      teamId: team.id,
      accessToken: 'xoxb-test-token',
      teamName: 'Test Workspace',
      defaultChannelName: '#general',
      enabled: true,
      eventTriggers: [WebhookTriggerEvents.DOCUMENT_CREATED, WebhookTriggerEvents.DOCUMENT_SIGNED],
    },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/slack`,
  });

  const toggle = page.locator('#slack-enabled');
  await expect(toggle).toBeVisible();

  const initialChecked = await toggle.isChecked();
  await toggle.click();
  await page.waitForTimeout(300);

  const updatedIntegration = await prisma.teamSlackIntegration.findUnique({
    where: { teamId: team.id },
  });
  expect(updatedIntegration?.enabled).toBe(!initialChecked);
});

test('[SLACK]: shows notification event checkboxes when connected', async ({ page }) => {
  const { user, team } = await seedUser();

  await prisma.teamSlackIntegration.create({
    data: {
      teamId: team.id,
      accessToken: 'xoxb-test-token',
      teamName: 'Test Workspace',
      defaultChannelName: '#general',
      enabled: true,
      eventTriggers: [WebhookTriggerEvents.DOCUMENT_CREATED],
    },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/slack`,
  });

  await expect(page.locator('#event-DOCUMENT_CREATED')).toBeVisible();
  await expect(page.locator('#event-DOCUMENT_SENT')).toBeVisible();
  await expect(page.locator('#event-DOCUMENT_COMPLETED')).toBeVisible();
  await expect(page.locator('#event-DOCUMENT_SIGNED')).toBeVisible();
});

test('[SLACK]: shows disconnect button when connected', async ({ page }) => {
  const { user, team } = await seedUser();

  await prisma.teamSlackIntegration.create({
    data: {
      teamId: team.id,
      accessToken: 'xoxb-test-token',
      teamName: 'Test Workspace',
      defaultChannelName: '#general',
      enabled: true,
      eventTriggers: [WebhookTriggerEvents.DOCUMENT_CREATED],
    },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/slack`,
  });

  const disconnectButton = page.getByRole('button', { name: 'Disconnect' });
  await expect(disconnectButton).toBeVisible();
});
