// @ts-check
import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'node:path'
const CWD = new URL(".", import.meta.url).pathname;
const contentScope = JSON.parse(readFileSync(join(CWD, "remote.json"), "utf8"));

test('hiding with CSS', async ({ page }, {project}) => {
  const supports = ['webkit']
  test.skip(!supports.includes(project.name))
  page.on('console', (msg) => {
    console.log(msg.type(), msg.text())
  })
  await page.route('**/*', (route, request) => {
    return route.fulfill({
      contentType: 'text/html',
      body: `
      <!doctype html>
      <html lang="en">
      <body>
        <div>before</div>
        <div id="google_ads_iframe">GOOGLE</div>
        <div>after</div>
      </body>
      </html>
      `
    })
  })
  await page.addInitScript((contentScope) => {
    // contentScope.features.elementHiding.state = "disabled"
    window.$CONTENT_SCOPE$ = contentScope
    window.$USER_UNPROTECTED_DOMAINS$ = []
    window.$USER_PREFERENCES$ = {
      platform: { name: "macos" }
    }
  }, contentScope);
  await page.addInitScript({ path: 'build/apple/contentScope.js' });
  await page.goto('https://playwright.dev');
  await expect(page.locator('#google_ads_iframe')).not.toBeVisible()
});
