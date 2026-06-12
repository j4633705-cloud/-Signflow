import { expect, test } from '@playwright/test';
import { WebhookCallStatus, WebhookTriggerEvents } from '@prisma/client';
import { prisma } from '@signflow/prisma';
import { seedBlankDocument } from '@signflow/prisma/seed/documents';
import { seedUser } from '@signflow/prisma/seed/users';

import { apiSignin } from '../fixtures/authentication';
import { expectTextToBeVisible } from '../fixtures/generic';

const seedWebhook = async ({
  webhookUrl,
  eventTriggers,
  secret,
  enabled,
  retryConfig,
  userId,
  teamId,
}: {
  webhookUrl: string;
  eventTriggers: WebhookTriggerEvents[];
  secret?: string | null;
  enabled?: boolean;
  retryConfig?: Record<string, unknown>;
  userId: number;
  teamId: number;
}) => {
  return await prisma.webhook.create({
    data: {
      webhookUrl,
      eventTriggers,
      secret: secret ?? null,
      enabled: enabled ?? true,
      retryConfig: retryConfig ?? undefined,
      userId,
      teamId,
    },
  });
};

test('[WEBHOOKS]: create webhook with retry configuration', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/webhooks`,
  });

  const webhookUrl = `https://example.com/webhook-retry-${Date.now()}`;

  await page.getByRole('button', { name: 'Create Webhook' }).click();

  await page.getByLabel('Webhook URL*').fill(webhookUrl);

  await page.getByLabel('Triggers').click();
  await page.waitForTimeout(200);
  await page.getByText('document.created').click();
  await page.getByText('The URL for signflow to send webhook events to.').click();

  await page.getByLabel('Secret').fill('test-secret');

  await page.getByLabel('Max Retries').fill('3');
  await page.getByLabel('Backoff Delay (ms)').fill('2000');

  await page.getByLabel('Backoff Type').click();
  await page.waitForTimeout(200);
  await page.getByText('Fixed').click();

  await page.getByRole('button', { name: 'Create' }).click();

  await expectTextToBeVisible(page, 'Webhook created');
  await expectTextToBeVisible(page, 'The webhook was successfully created.');

  await expect(page.getByText(webhookUrl)).toBeVisible();

  const dbWebhook = await prisma.webhook.findFirstOrThrow({
    where: { userId: user.id },
  });

  expect(dbWebhook.eventTriggers).toEqual([WebhookTriggerEvents.DOCUMENT_CREATED]);
  expect(dbWebhook.secret).toBe('test-secret');
  expect(dbWebhook.enabled).toBe(true);
  expect(dbWebhook.retryConfig).toEqual({
    maxRetries: 3,
    backoffDelay: 2000,
    backoffType: 'fixed',
  });
});

test('[WEBHOOKS]: view health dashboard with webhook calls', async ({ page }) => {
  const { user, team } = await seedUser();

  const webhookUrl = `https://example.com/webhook-health-${Date.now()}`;

  const webhook = await seedWebhook({
    webhookUrl,
    eventTriggers: [WebhookTriggerEvents.DOCUMENT_CREATED],
    userId: user.id,
    teamId: team.id,
    enabled: true,
  });

  const document = await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'Health Test Doc' },
  });

  await prisma.webhookCall.create({
    data: {
      webhookId: webhook.id,
      url: webhookUrl,
      event: WebhookTriggerEvents.DOCUMENT_CREATED,
      status: WebhookCallStatus.SUCCESS,
      responseCode: 200,
      requestBody: { event: WebhookTriggerEvents.DOCUMENT_CREATED, payload: { id: document.id } },
    },
  });

  await prisma.webhookCall.create({
    data: {
      webhookId: webhook.id,
      url: webhookUrl,
      event: WebhookTriggerEvents.DOCUMENT_CREATED,
      status: WebhookCallStatus.FAILED,
      responseCode: 500,
      requestBody: { event: WebhookTriggerEvents.DOCUMENT_CREATED, payload: { id: document.id } },
    },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/webhooks/${webhook.id}`,
  });

  await expect(page.getByText(webhookUrl)).toBeVisible();
  await expect(page.getByText('Enabled')).toBeVisible();

  const successBadge = page.locator('text=200').first();
  await expect(successBadge).toBeVisible();

  await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Success' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Failed' })).toBeVisible();

  await page.getByRole('tab', { name: 'Failed' }).click();
  await page.waitForTimeout(300);

  await expect(page.getByText('500')).toBeVisible();
});

test('[WEBHOOKS]: send test webhook via dialog', async ({ page }) => {
  const { user, team } = await seedUser();

  const webhookUrl = `https://example.com/webhook-test-${Date.now()}`;

  const webhook = await seedWebhook({
    webhookUrl,
    eventTriggers: [WebhookTriggerEvents.DOCUMENT_CREATED, WebhookTriggerEvents.DOCUMENT_SENT],
    userId: user.id,
    teamId: team.id,
    enabled: true,
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/webhooks/${webhook.id}`,
  });

  await expect(page.getByText('Test')).toBeVisible();
  await page.getByText('Test').click();

  await expect(page.getByText('Test Webhook')).toBeVisible();
  await expect(page.getByText(webhookUrl)).toBeVisible();

  await page.getByLabel('Event Type').click();
  await page.waitForTimeout(200);
  await page.getByText('document.created').first().click();

  await page.getByRole('button', { name: 'Send' }).click();
});

test('[WEBHOOKS]: webhook detail shows retry attempt in call logs', async ({ page }) => {
  const { user, team } = await seedUser();

  const webhookUrl = `https://example.com/webhook-retry-call-${Date.now()}`;

  const webhook = await seedWebhook({
    webhookUrl,
    eventTriggers: [WebhookTriggerEvents.DOCUMENT_CREATED],
    userId: user.id,
    teamId: team.id,
    enabled: true,
  });

  const document = await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'Retry Call Test' },
  });

  const webhookCall = await prisma.webhookCall.create({
    data: {
      webhookId: webhook.id,
      url: webhookUrl,
      event: WebhookTriggerEvents.DOCUMENT_CREATED,
      status: WebhookCallStatus.FAILED,
      responseCode: 502,
      retryAttempt: 2,
      requestBody: { event: WebhookTriggerEvents.DOCUMENT_CREATED, payload: { id: document.id } },
    },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/webhooks/${webhook.id}`,
  });

  await expect(page.getByText(webhookCall.id)).toBeVisible();
});

test('[WEBHOOKS]: filter webhook calls by status', async ({ page }) => {
  const { user, team } = await seedUser();

  const webhookUrl = `https://example.com/webhook-filter-${Date.now()}`;

  const webhook = await seedWebhook({
    webhookUrl,
    eventTriggers: [WebhookTriggerEvents.DOCUMENT_CREATED],
    userId: user.id,
    teamId: team.id,
    enabled: true,
  });

  const document = await seedBlankDocument(user, team.id, {
    createDocumentOptions: { title: 'Filter Test Doc' },
  });

  await prisma.webhookCall.create({
    data: {
      webhookId: webhook.id,
      url: webhookUrl,
      event: WebhookTriggerEvents.DOCUMENT_CREATED,
      status: WebhookCallStatus.SUCCESS,
      responseCode: 200,
      requestBody: { event: WebhookTriggerEvents.DOCUMENT_CREATED, payload: { id: document.id } },
    },
  });

  await prisma.webhookCall.create({
    data: {
      webhookId: webhook.id,
      url: webhookUrl,
      event: WebhookTriggerEvents.DOCUMENT_CREATED,
      status: WebhookCallStatus.FAILED,
      responseCode: 500,
      requestBody: { event: WebhookTriggerEvents.DOCUMENT_CREATED, payload: { id: document.id } },
    },
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/webhooks/${webhook.id}`,
  });

  await page.getByRole('tab', { name: 'Success' }).click();
  await page.waitForTimeout(300);
  await expect(page.getByText('200')).toBeVisible();

  await page.getByRole('tab', { name: 'Failed' }).click();
  await page.waitForTimeout(300);
  await expect(page.getByText('500')).toBeVisible();

  await page.getByRole('tab', { name: 'All' }).click();
  await page.waitForTimeout(300);
});
