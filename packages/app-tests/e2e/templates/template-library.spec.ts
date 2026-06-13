import { expect, test } from '@playwright/test';
import { TemplateType } from '@prisma/client';
import { prisma } from '@signflow/prisma';
import { seedBlankTemplate } from '@signflow/prisma/seed/templates';
import { seedUser } from '@signflow/prisma/seed/users';

import { apiSignin } from '../fixtures/authentication';

test.describe.configure({ mode: 'parallel' });

const seedPublicTemplate = async ({
  userId,
  teamId,
  teamUrl,
  publicTitle = 'Test Public Template',
  publicDescription = 'A test template for E2E tests',
}: {
  userId: number;
  teamId: number;
  teamUrl: string;
  publicTitle?: string;
  publicDescription?: string;
}) => {
  const template = await seedBlankTemplate(userId, teamId, {
    createTemplateOptions: {
      title: publicTitle,
      publicDescription,
      templateType: TemplateType.PUBLIC,
      teamId,
      userId,
    },
  });

  await prisma.envelope.update({
    where: { id: template.id },
    data: {
      publicTitle,
      publicDescription,
      templateType: TemplateType.PUBLIC,
    },
  });

  return template;
};

test('[TEMPLATE LIBRARY]: shows empty state when no public templates', async ({ page }) => {
  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/templates/library',
  });

  await expect(page.getByText('Template Library')).toBeVisible();
  await expect(page.getByText('No templates found')).toBeVisible();
});

test('[TEMPLATE LIBRARY]: shows public templates in the grid', async ({ page }) => {
  const author = await seedUser();

  await seedPublicTemplate({
    userId: author.user.id,
    teamId: author.team.id,
    teamUrl: author.team.url,
    publicTitle: 'NDA Agreement',
    publicDescription: 'A standard non-disclosure agreement template.',
  });

  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/templates/library',
  });

  await expect(page.getByText('Template Library')).toBeVisible();
  await expect(page.getByText('NDA Agreement')).toBeVisible();
  await expect(page.getByText('A standard non-disclosure agreement template.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use Template' })).toBeVisible();
});

test('[TEMPLATE LIBRARY]: search filters templates', async ({ page }) => {
  const author = await seedUser();

  await seedPublicTemplate({
    userId: author.user.id,
    teamId: author.team.id,
    teamUrl: author.team.url,
    publicTitle: 'Employment Contract',
    publicDescription: 'Standard employment contract.',
  });

  await seedPublicTemplate({
    userId: author.user.id,
    teamId: author.team.id,
    teamUrl: author.team.url,
    publicTitle: 'Sales Agreement',
    publicDescription: 'Sales agreement template.',
  });

  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/templates/library',
  });

  await expect(page.getByText('Employment Contract')).toBeVisible();
  await expect(page.getByText('Sales Agreement')).toBeVisible();

  await page.locator('input[placeholder="Search templates..."]').fill('Employment');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForTimeout(500);

  await expect(page.getByText('Employment Contract')).toBeVisible();
  await expect(page.getByText('Sales Agreement')).not.toBeVisible();
});

test('[TEMPLATE LIBRARY]: use template duplicates it for current user', async ({ page }) => {
  const author = await seedUser();

  const _template = await seedPublicTemplate({
    userId: author.user.id,
    teamId: author.team.id,
    teamUrl: author.team.url,
    publicTitle: 'License Agreement',
    publicDescription: 'Software license agreement.',
  });

  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/templates/library',
  });

  await expect(page.getByText('License Agreement')).toBeVisible();

  const useButton = page.getByRole('button', { name: 'Use Template' });
  await useButton.click();
  await page.waitForTimeout(500);

  const userTemplates = await prisma.envelope.findMany({
    where: {
      userId: user.id,
      type: 'TEMPLATE',
    },
  });

  expect(userTemplates.length).toBeGreaterThan(0);
  const duplicated = userTemplates.find((t) => t.title === 'License Agreement');
  expect(duplicated).toBeTruthy();
});

test('[TEMPLATE LIBRARY]: shows multiple public templates from different authors', async ({ page }) => {
  const author1 = await seedUser();
  const author2 = await seedUser();

  await seedPublicTemplate({
    userId: author1.user.id,
    teamId: author1.team.id,
    teamUrl: author1.team.url,
    publicTitle: 'Author 1 Template',
  });

  await seedPublicTemplate({
    userId: author2.user.id,
    teamId: author2.team.id,
    teamUrl: author2.team.url,
    publicTitle: 'Author 2 Template',
  });

  const { user, team } = await seedUser();

  await apiSignin({
    page,
    email: user.email,
    redirectPath: '/templates/library',
  });

  await expect(page.getByText('Author 1 Template')).toBeVisible();
  await expect(page.getByText('Author 2 Template')).toBeVisible();
});
