import { defineConfig } from '@playwright/test'

export default defineConfig({
    webServer: {
        reuseExistingServer: true,
        ignoreHTTPSErrors: true,
        command: 'npm run serve',
        port: 3220
    },
    projects: [
        {
            name: 'windows',
            testMatch: 'integration-test/playwright/*.spec.js',
            use: { platform: 'windows' }
        }
    ],
    fullyParallel: false,
    use: {
        baseURL: 'http://localhost:3220/'
    }
})
