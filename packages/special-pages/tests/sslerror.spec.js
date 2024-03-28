import { test } from '@playwright/test'
import { SSLErrorPage } from './page-objects/sslerror'

test.describe('sslerror', () => {
    test.only('initial handshake', async ({ page }, workerInfo) => {
        const ssl = SSLErrorPage.create(page, workerInfo)
        await ssl.openPage()
        await page.pause()
    })
})
