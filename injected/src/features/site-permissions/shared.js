/**
 * Helpers shared by the iOS site permission features. Call them from `load()`,
 * before page scripts can replace the globals they read.
 */

/**
 * @returns {string | null} 32 lowercase hex characters, or null without `crypto.getRandomValues`
 */
export function randomHexToken() {
    if (typeof globalThis.crypto?.getRandomValues !== 'function') {
        return null;
    }
    const values = new Uint32Array(4);
    globalThis.crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('');
}

/**
 * @param {string} hostname - lowercase
 */
export function isDuckAiHostname(hostname) {
    return hostname === 'duck.ai' || hostname.endsWith('.duck.ai');
}

/**
 * WebKit exposes the document's effective Permissions Policy under either name, or neither.
 *
 * @returns {{ allowsFeature?: (feature: string) => boolean } | undefined}
 */
export function permissionsPolicy() {
    const doc = /** @type {Document & { permissionsPolicy?: any, featurePolicy?: any }} */ (document);
    return doc.permissionsPolicy ?? doc.featurePolicy;
}
