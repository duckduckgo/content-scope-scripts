import { defineConfig } from '@playwright/test'

export default defineConfig({
    projects: [
        {
            name: 'duckplayer-windows',
            testMatch: 'duckplayer.spec.js',
            use: { platform: 'windows' }
        },
        {
            name: 'duckplayer-apple',
            testMatch: 'duckplayer.spec.js',
            use: { platform: 'apple' }
        }
    ],
    fullyParallel: false,
    webServer: {
        command: 'npm run serve',
        port: 3210,
        reuseExistingServer: true,
        env: process.env
    }
})
