import { test, expect } from '@playwright/test';

test('browser language, manual choice and persistence preserve the battle', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-GB' });
  const page = await context.newPage();
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#opponent-setup')).toBeVisible();
  await expect(page.locator('#start')).toContainText('Start battle');
  await page.locator('#start').click();
  await page.locator('#enemy-board button:enabled').first().click();
  await expect(page.locator('#enemy-status')).toHaveText('You’re attacking', { timeout: 15000 });
  await page.locator('#settings-open').click();
  const ships = await page.locator('#player-board').innerHTML();
  const shots = await page.locator('.sea-grid .miss, .sea-grid .hit, .sea-grid .sunk').count();
  await page.locator('.settings').getByRole('button', { name: 'Polski', exact: true }).click();
  await expect(page.locator('#enemy-status')).toHaveText('Atakujesz');
  expect(await page.locator('.sea-grid .miss, .sea-grid .hit, .sea-grid .sunk').count()).toBe(shots);
  // Classes and positions stay unchanged; accessible labels follow the new language.
  const cells = await page.locator('#player-board .cell').evaluateAll(nodes => nodes.map(node => node.className));
  await page.locator('.settings').getByRole('button', { name: 'English', exact: true }).click();
  expect(await page.locator('#player-board .cell').evaluateAll(nodes => nodes.map(node => node.className))).toEqual(cells);
  expect(await page.locator('#player-board').innerHTML()).toBe(ships);
  await page.locator('.settings').getByRole('button', { name: 'Polski', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(page.locator('#start')).toContainText('Rozpocznij bitwę');
  await context.close();
});

test('unrelated browser languages fall back to English even when storage is unavailable', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'fr-FR' });
  const page = await context.newPage();
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Blocked'); } }));
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('#settings-open').click();
  await page.locator('.settings').getByRole('button', { name: 'Polski', exact: true }).click();
  await expect(page.locator('#start')).toHaveText('Rozpocznij bitwę');
  await context.close();
});
