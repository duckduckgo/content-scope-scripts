// Shared by the Windows and macOS chromeWebstorePatching specs.

// Logged (tests run with debug on) once a failed catalog lookup has resolved
export const LOG_CATALOG_ERROR = 'getCatalogExtensionIds failed';
export const LOG_CATALOG_UNUSABLE = 'getCatalogExtensionIds: timed out or malformed reply';

/**
 * Resolves once the feature logs `text`. Failed catalog lookups leave the
 * button exactly as hidden as it starts, so a test must wait for the failure to
 * be processed or its "stays hidden" assertion would pass vacuously.
 * @param {import('@playwright/test').Page} page
 * @param {string} text
 */
export function waitForFeatureLog(page, text) {
    return page.waitForEvent('console', { predicate: (msg) => msg.text().includes(text), timeout: 10000 });
}
