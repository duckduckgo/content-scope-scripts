import { defineConfig } from '@playwright/test'

export default defineConfig({
    projects: [
        {
            name: 'duckplayer-windows',
            testMatch: ['duckplayer.spec.js', 'debug-tools.spec.js'],
            use: { injectName: 'windows', platform: 'windows' }
        },
        {
            name: 'duckplayer-apple',
            testMatch: ['duckplayer.spec.js', 'debug-tools.spec.js'],
            use: { injectName: 'apple', platform: 'macos' }
        }
    ],
    fullyParallel: !process.env.CI,
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
        actionTimeout: 1000,
        trace: 'on-first-retry'
    }
})
