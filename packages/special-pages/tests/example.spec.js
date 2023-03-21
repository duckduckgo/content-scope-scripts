import { test, expect } from '@playwright/test'

test('example special page', async ({ page }) => {
    await page.goto('/example/')

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Example special page/)

    // this ensures the JS is loading and appending the element
    await page.getByRole('heading', { name: 'This is an appended element' }).waitFor({ timeout: 1000 })
})
