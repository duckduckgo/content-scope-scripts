import { defineConfig } from '@playwright/test'

export default defineConfig({
    webServer: {
        command: 'npm run serve',
        port: 3210,
        reuseExistingServer: true,
        env: process.env
    }
})
