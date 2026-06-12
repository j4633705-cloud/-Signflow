import { expect, test } from '@playwright/test';
import { AutomationActionType, AutomationTriggerType } from '@prisma/client';
import { prisma } from '@signflow/prisma';
import { seedUser } from '@signflow/prisma/seed/users';

import { apiSignin } from '../fixtures/authentication';

test.describe.configure({ mode: 'parallel' });

const seedAutomation = async ({
  name,
  description,
  enabled,
  triggerType,
  actions,
  teamId,
}: {
  name: string;
  description?: string;
  enabled?: boolean;
  triggerType: AutomationTriggerType;
  actions: Array<{ type: AutomationActionType; config: Record<string, unknown>; order?: number }>;
  teamId: number;
}) => {
  return await prisma.automation.create({
    data: {
      name,
      description,
      enabled: enabled ?? true,
      teamId,
      trigger: {
        create: { type: triggerType },
      },
      actions: {
        create: actions.map((a, i) => ({
          type: a.type,
          config: a.config,
          order: a.order ?? i,
        })),
      },
    },
    include: { trigger: true, actions: true },
  });
};

test('[AUTOMATIONS]: shows empty state for new team', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/automations`,
  });

  await expect(page.getByText('Automations')).toBeVisible();
  await expect(page.getByText('No Automations Yet')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Automation' })).toBeVisible();
});

test('[AUTOMATIONS]: create automation with email action', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/automations`,
  });

  await page.getByRole('link', { name: 'New Automation' }).click();
  await page.waitForURL(`/t/${team.url}/settings/automations/new`);

  await expect(page.getByText('New Automation')).toBeVisible();

  await page.locator('#name').fill('Test Email Automation');
  await page.locator('#description').fill('Sends an email when document is completed');

  await page.locator('#triggerType').click();
  await page.waitForTimeout(200);
  await page.getByText('Document Completed').click();

  await page.getByRole('button', { name: 'Add Action' }).click();

  await page.locator('#actions\\.0\\.type').click();
  await page.waitForTimeout(200);
  await page.getByText('Send Email').click();

  await page.locator('#actions\\.0\\.config\\.email').fill('test@example.com');
  await page.locator('#actions\\.0\\.config\\.subject').fill('Document Update');
  await page.locator('#actions\\.0\\.config\\.body').fill('Your document has been completed.');

  await page.getByRole('button', { name: 'Create Automation' }).click();

  await page.waitForURL(`/t/${team.url}/settings/automations`);

  await expect(page.getByText('Test Email Automation')).toBeVisible();
  await expect(page.getByText('Document Completed')).toBeVisible();
  await expect(page.getByText('Send Email')).toBeVisible();
  await expect(page.getByText('Enabled')).toBeVisible();

  const dbAutomation = await prisma.automation.findFirstOrThrow({
    where: { teamId: team.id },
    include: { trigger: true, actions: true },
  });

  expect(dbAutomation.name).toBe('Test Email Automation');
  expect(dbAutomation.description).toBe('Sends an email when document is completed');
  expect(dbAutomation.enabled).toBe(true);
  expect(dbAutomation.trigger?.type).toBe(AutomationTriggerType.DOCUMENT_COMPLETED);
  expect(dbAutomation.actions).toHaveLength(1);
  expect(dbAutomation.actions[0].type).toBe(AutomationActionType.SEND_EMAIL);
  expect(dbAutomation.actions[0].config).toEqual({
    email: 'test@example.com',
    subject: 'Document Update',
    body: 'Your document has been completed.',
  });
});

test('[AUTOMATIONS]: create automation with all action types', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/automations/new`,
  });

  await page.locator('#name').fill('Multi-Action Automation');
  await page.locator('#triggerType').click();
  await page.waitForTimeout(200);
  await page.getByText('Document Signed').click();

  await page.getByRole('button', { name: 'Add Action' }).click();
  await page.locator('#actions\\.0\\.type').click();
  await page.waitForTimeout(200);
  await page.getByText('Send Email').click();
  await page.locator('#actions\\.0\\.config\\.email').fill('a@test.com');
  await page.locator('#actions\\.0\\.config\\.subject').fill('Signed!');
  await page.locator('#actions\\.0\\.config\\.body').fill('Doc signed.');

  await page.getByRole('button', { name: 'Add Action' }).click();
  await page.locator('#actions\\.1\\.type').click();
  await page.waitForTimeout(200);
  await page.getByText('Send Slack Message').click();
  await page.locator('#actions\\.1\\.config\\.channel').fill('#alerts');
  await page.locator('#actions\\.1\\.config\\.message').fill('A document was signed!');

  await page.getByRole('button', { name: 'Add Action' }).click();
  await page.locator('#actions\\.2\\.type').click();
  await page.waitForTimeout(200);
  await page.getByText('Send Webhook').click();
  await page.locator('#actions\\.2\\.config\\.url').fill('https://example.com/hook');

  await page.getByRole('button', { name: 'Create Automation' }).click();
  await page.waitForURL(`/t/${team.url}/settings/automations`);

  await expect(page.getByText('Multi-Action Automation')).toBeVisible();

  const dbAutomation = await prisma.automation.findFirstOrThrow({
    where: { teamId: team.id, name: 'Multi-Action Automation' },
    include: { actions: true },
  });

  expect(dbAutomation.actions).toHaveLength(3);
  expect(dbAutomation.actions.map((a) => a.type).sort()).toEqual([
    AutomationActionType.SEND_EMAIL,
    AutomationActionType.SEND_SLACK,
    AutomationActionType.SEND_WEBHOOK,
  ]);
});

test('[AUTOMATIONS]: edit automation name and trigger', async ({ page }) => {
  const { user, team } = await seedUser();

  const automation = await seedAutomation({
    name: 'Original Name',
    triggerType: AutomationTriggerType.DOCUMENT_COMPLETED,
    actions: [
      { type: AutomationActionType.SEND_EMAIL, config: { email: 'test@test.com', subject: 'Test', body: 'Test body' } },
    ],
    teamId: team.id,
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/automations/${automation.id}`,
  });

  await expect(page.getByText('Edit Automation')).toBeVisible();

  await page.locator('#name').clear();
  await page.locator('#name').fill('Updated Name');

  await page.locator('#triggerType').click();
  await page.waitForTimeout(200);
  await page.getByText('Document Rejected').click();

  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.waitForURL(`/t/${team.url}/settings/automations`);

  await expect(page.getByText('Updated Name')).toBeVisible();

  const dbAutomation = await prisma.automation.findUniqueOrThrow({
    where: { id: automation.id },
    include: { trigger: true },
  });

  expect(dbAutomation.name).toBe('Updated Name');
  expect(dbAutomation.trigger?.type).toBe(AutomationTriggerType.DOCUMENT_REJECTED);
});

test('[AUTOMATIONS]: toggle automation enabled/disabled', async ({ page }) => {
  const { user, team } = await seedUser();

  const automation = await seedAutomation({
    name: 'Togglable Automation',
    enabled: true,
    triggerType: AutomationTriggerType.DOCUMENT_COMPLETED,
    actions: [{ type: AutomationActionType.SEND_EMAIL, config: { email: 't@t.com', subject: 'S', body: 'B' } }],
    teamId: team.id,
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/automations`,
  });

  await expect(page.getByText('Enabled')).toBeVisible();

  const toggle = page.locator(`#automation-toggle-${automation.id}`);
  await toggle.click();
  await page.waitForTimeout(300);

  const dbAfter = await prisma.automation.findUniqueOrThrow({ where: { id: automation.id } });
  expect(dbAfter.enabled).toBe(false);

  await toggle.click();
  await page.waitForTimeout(300);

  const dbAfterReEnable = await prisma.automation.findUniqueOrThrow({ where: { id: automation.id } });
  expect(dbAfterReEnable.enabled).toBe(true);
});

test('[AUTOMATIONS]: delete automation', async ({ page }) => {
  const { user, team } = await seedUser();

  const automation = await seedAutomation({
    name: 'To Be Deleted',
    enabled: true,
    triggerType: AutomationTriggerType.DOCUMENT_COMPLETED,
    actions: [{ type: AutomationActionType.SEND_EMAIL, config: { email: 'x@x.com', subject: 'X', body: 'X' } }],
    teamId: team.id,
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/automations/${automation.id}`,
  });

  await page.getByRole('button', { name: 'Delete Automation' }).click();

  const deleteMessage = `delete ${automation.name}`;
  await page.getByLabel(/Confirm by typing/).fill(deleteMessage);

  await page.getByRole('button', { name: 'Delete' }).click();
  await page.waitForURL(`/t/${team.url}/settings/automations`);

  await expect(page.getByText('To Be Deleted')).not.toBeVisible();

  const dbCount = await prisma.automation.count({ where: { id: automation.id } });
  expect(dbCount).toBe(0);
});

test('[AUTOMATIONS]: view seeded automations in list', async ({ page }) => {
  const { user, team } = await seedUser();

  await seedAutomation({
    name: 'Automation A',
    triggerType: AutomationTriggerType.DOCUMENT_COMPLETED,
    actions: [{ type: AutomationActionType.SEND_EMAIL, config: { email: 'a@a.com', subject: 'A', body: 'A' } }],
    teamId: team.id,
  });

  await seedAutomation({
    name: 'Automation B',
    triggerType: AutomationTriggerType.DOCUMENT_SIGNED,
    actions: [{ type: AutomationActionType.SEND_WEBHOOK, config: { url: 'https://example.com/b' } }],
    teamId: team.id,
  });

  await apiSignin({
    page,
    email: user.email,
    redirectPath: `/t/${team.url}/settings/automations`,
  });

  await expect(page.getByText('Automation A')).toBeVisible();
  await expect(page.getByText('Automation B')).toBeVisible();
  await expect(page.getByText('Document Completed')).toBeVisible();
  await expect(page.getByText('Document Signed')).toBeVisible();
});

test('[AUTOMATIONS]: cannot access automation from another team', async ({ page }) => {
  const team1 = await seedUser();
  const team2 = await seedUser();

  const automation = await seedAutomation({
    name: 'Team 1 Secret',
    triggerType: AutomationTriggerType.DOCUMENT_COMPLETED,
    actions: [{ type: AutomationActionType.SEND_EMAIL, config: { email: 's@s.com', subject: 'S', body: 'S' } }],
    teamId: team1.team.id,
  });

  await apiSignin({
    page,
    email: team2.user.email,
    redirectPath: `/t/${team2.team.url}/settings/automations/${automation.id}`,
  });

  await expect(page.getByText('Automation not found')).toBeVisible();
});
