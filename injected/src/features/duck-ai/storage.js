/**
 * @param {string} platformName
 * @returns {boolean}
 */
export function isWebKitPlatform(platformName) {
    return platformName === 'ios' || platformName === 'macos';
}

/**
 * WebKit removes `window.indexedDB` entirely when Lockdown Mode is on; elsewhere a missing API stays an error.
 * @param {string} platformName
 * @returns {boolean}
 */
export function isIndexedDBDisabled(platformName) {
    return isWebKitPlatform(platformName) && !('indexedDB' in window);
}
