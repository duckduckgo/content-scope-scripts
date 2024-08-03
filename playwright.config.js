import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    projects: [
        {
            name: 'windows',
            testMatch: [
                'integration-test/playwright/duckplayer.spec.js',
                'integration-test/playwright/duckplayer-remote-config.spec.js',
                'integration-test/playwright/harmful-apis.spec.js',
                'integration-test/playwright/windows-permissions.spec.js',
                'integration-test/playwright/broker-protection.spec.js',
                'integration-test/playwright/breakage-reporting.spec.js'
            ],
            use: { injectName: 'windows', platform: 'windows' }
        },
        {
            name: 'apple-isolated',
            testMatch: [
                'integration-test/playwright/duckplayer.spec.js',
                'integration-test/playwright/duckplayer-remote-config.spec.js',
                'integration-test/playwright/broker-protection.spec.js'
            ],
            use: { injectName: 'apple-isolated', platform: 'macos' }
        },
        {
            name: 'apple',
            testMatch: [
                'integration-test/playwright/webcompat.spec.js'
            ],
            use: { injectName: 'apple', platform: 'macos' }
        },
        {
            name: 'chrome',
            testMatch: 'integration-test/playwright/remote-pages.spec.js',
            use: { injectName: 'chrome', platform: 'extension', ...devices['Desktop Chrome'] }
        },
        {
            name: 'firefox',
            testMatch: 'integration-test/playwright/remote-pages.spec.js',
            use: { injectName: 'firefox', platform: 'extension', ...devices['Desktop Firefox'] }
        }
    ],
    timeout: 30 * 1000,
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toHaveText();`
         */
        timeout: 5000
    },
    /* Run tests in files in parallel */
    fullyParallel: !process.env.CI,
    /* Don't allow `.only` in CI */
    forbidOnly: Boolean(process.env.CI),
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : [['html', { open: 'never' }]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    webServer: {
        reuseExistingServer: true,
        ignoreHTTPSErrors: true,
        command: 'npm run serve',
        port: 3220
    },
    use: {
        /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
        actionTimeout: 1000,
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:3220/',
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry'
    }
})
