import { defineConfig } from '@playwright/test'

export default defineConfig({
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
