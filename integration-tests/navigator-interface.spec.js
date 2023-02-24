// @ts-check
import { test, expect } from '@playwright/test'

test('navigator interface', async ({ page }, {project}) => {
  const supports = ['webkit']
  test.skip(!supports.includes(project.name))
  page.on('console', (msg) => {
    console.log(msg.type(), msg.text())
  })
  await page.route('**/*', (route, request) => {
    return route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><body></body></html>`
    })
  })
  await page.addInitScript(() => {
    window.$CONTENT_SCOPE$ = {
      unprotectedTemporary: [],
      features: {
        navigatorInterface: {
          state:"enabled",
          exceptions: [],
        }
      }
    }
    window.$USER_UNPROTECTED_DOMAINS$ = []
    window.$USER_PREFERENCES$ = {
      platform: { name: "macos" }
    }
  });
  await page.addInitScript({ path: 'build/apple/contentScope.js' });
  await page.goto('https://playwright.dev');
  const value = await page.evaluate(() => navigator.duckduckgo?.platform);
  await expect(value).toBe('macos')
});
