const { test, expect } = require('@playwright/test');

async function attachDiagnostics(page, testInfo) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`);
  });
  await testInfo.attach('diagnostics.json', {
    body: JSON.stringify({ consoleErrors, pageErrors, failedRequests }, null, 2),
    contentType: 'application/json',
  });
  return { consoleErrors, pageErrors, failedRequests };
}

test('loads the game and exposes the main controls', async ({ page }, testInfo) => {
  const diagnostics = await attachDiagnostics(page, testInfo);
  await page.goto('/');
  await expect(page).toHaveTitle('JOY CRICKET WORLD');
  await expect(page.getByText('JOY CRICKET WORLD')).toBeVisible();
  await expect(page.locator('#runs')).toHaveText('0');
  await expect(page.locator('#wickets')).toHaveText('0/3');
  await expect(page.locator('#target')).toHaveText('20');
  await expect(page.locator('#reset')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('initial-load.png'), fullPage: true });
  expect(diagnostics.pageErrors).toEqual([]);
});

test('allows a shot and reset', async ({ page }, testInfo) => {
  await page.goto('/');
  const buttons = page.locator('[data-shot]');
  await expect(buttons.first()).toBeEnabled({ timeout: 5000 });
  await page.screenshot({ path: testInfo.outputPath('incoming-ball.png'), fullPage: true });
  await buttons.nth(1).click();
  await expect(buttons.first()).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath('after-shot.png'), fullPage: true });
  await page.locator('#reset').click();
  await expect(page.locator('#runs')).toHaveText('0');
  await expect(page.locator('#wickets')).toHaveText('0/3');
  await expect(buttons.first()).toBeDisabled();
});

test('supports keyboard shot controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-shot]').first()).toBeEnabled({ timeout: 5000 });
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-shot]').first()).toBeDisabled();
});
