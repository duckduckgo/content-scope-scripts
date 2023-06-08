import { defineConfig } from '@playwright/test'

export default defineConfig({
    projects: [
        {
            name: 'duckplayer-windows',
            testMatch: 'duckplayer.spec.js',
            use: { injectName: 'windows', platform: 'windows' }
        },
        {
            name: 'duckplayer-apple',
            testMatch: 'duckplayer.spec.js',
            use: { injectName: 'apple', platform: 'macos' }
        }
    ],
    fullyParallel: true,
    // @ts-expect-error - Type 'undefined' is not assignable to type 'string'. process.env
    webServer: {
        command: 'npm run serve',
        port: 3210,
        reuseExistingServer: true,
        env: process.env
    }
})
