import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    projects: [
        {
            name: 'windows',
            testMatch: [
                'duckplayer.spec.js',
                'duckplayer-screenshots.spec.js',
                'onboarding.spec.js'
            ],
            use: {
                ...devices['Desktop Edge'],
                injectName: 'windows',
                platform: 'windows'
            }
        },
        {
            name: 'integration',
            testMatch: [
                'new-tab-widgets.spec.js',
                'new-tab.spec.js'
            ],
            use: {
                ...devices['Desktop Chrome'],
                injectName: 'integration',
                platform: 'windows'
            }
        },
        {
            name: 'macos',
            testMatch: [
                'duckplayer.spec.js',
                'duckplayer-screenshots.spec.js',
                'onboarding.spec.js',
                'sslerror.spec.js',
                'release-notes.spec.js',
                'special-error.spec.js'
            ],
            use: {
                ...devices['Desktop Safari'],
                injectName: 'apple',
                platform: 'macos'
            }
        },
        {
            name: 'android',
            testMatch: [
                'duckplayer.spec.js',
                'duckplayer-screenshots.spec.js'
            ],
            use: {
                ...devices['Galaxy S III'],
                injectName: 'android',
                platform: 'android'
            }
        },
        {
            name: 'android-landscape',
            testMatch: [
                'duckplayer-screenshots.spec.js'
            ],
            use: {
                ...devices['Galaxy S III landscape'],
                injectName: 'android',
                platform: 'android'
            }
        },
        {
            name: 'ios',
            testMatch: [
                'duckplayer.spec.js',
                'duckplayer-screenshots.spec.js'
            ],
            use: {
                ...devices['iPhone 14'],
                injectName: 'apple',
                platform: 'ios'
            }
        }
    ],
    fullyParallel: !process.env.CI,
    /* Don't allow `.only` in CI */
    forbidOnly: Boolean(process.env.CI),
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : [['html', { open: 'never' }]],
    // @ts-expect-error - Type 'undefined' is not assignable to type 'string'. process.env
    webServer: {
        command: 'npm run serve',
        port: 3210,
        reuseExistingServer: true,
        env: process.env
    },
    use: {
        actionTimeout: 5000,
        trace: 'on-first-retry'
    }
})