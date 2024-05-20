import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    projects: [
        {
            name: 'duckplayer-windows',
            testMatch: 'duckplayer.spec.js',
            use: {
                ...devices['Desktop Edge'],
                injectName: 'windows',
                platform: 'windows'
            }
        },
        {
            name: 'duckplayer-apple',
            testMatch: 'duckplayer.spec.js',
            use: {
                ...devices['Desktop Safari'],
                injectName: 'apple',
                platform: 'macos'
            }
        },
        {
            name: 'sslerrorpage-apple',
            testMatch: 'sslerror.spec.js',
            use: {
                ...devices['Desktop Safari'],
                injectName: 'apple',
                platform: 'macos'
            }
        },
        {
            name: 'onboarding-windows',
            testMatch: 'onboarding.spec.js',
            use: {
                ...devices['Desktop Edge'],
                injectName: 'windows',
                platform: 'windows'
            }
        },
        {
            name: 'newtab-windows',
            testMatch: 'newtab.spec.js',
            use: {
                ...devices['Desktop Edge'],
                injectName: 'windows',
                platform: 'windows'
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
