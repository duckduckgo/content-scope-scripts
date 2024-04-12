import { test } from '@playwright/test'
import { SSLErrorPage } from './page-objects/sslerror'

test.describe('sslerror', () => {
    test('leaves site', async ({ page }, workerInfo) => {
        const ssl = SSLErrorPage.create(page, workerInfo)
        await ssl.openPage()
        await ssl.leavesSite()
    })
    test('visits site', async ({ page }, workerInfo) => {
        const ssl = SSLErrorPage.create(page, workerInfo)
        await ssl.openPage()
        await ssl.visitsSite()
    })
})
