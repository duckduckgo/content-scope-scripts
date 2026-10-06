/**
 * Pure helpers for the chromeWebstorePatching feature.
 */

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}

/**
 * Extracts the extension ID from a Chrome Web Store detail-page path, e.g.
 * /detail/bitwarden-password-manag/nngceckbapebfimnlniiiahkandclblb
 * The slug segment is optional; IDs are exactly 32 chars of a-p.
 * @param {string} pathname
 * @returns {string|null} null when not on a detail page
 */
export function parseExtensionId(pathname) {
    const match = pathname.match(/\/detail\/(?:[^/]+\/)?([a-p]{32})(?:[/?#]|$)/);
    return match?.[1] ?? null;
}

/**
 * Remote config is a hot-fix channel, so a malformed selector is a question of
 * when, not if. One bad entry would invalidate the entire injected CSS rule —
 * dropping the fail-closed hide and revealing Google's own install button — and
 * throw out of querySelectorAll. Bad entries are discarded; good ones still apply.
 * @param {string} selector
 * @returns {boolean}
 */
export function isValidSelector(selector) {
    try {
        document.createDocumentFragment().querySelector(selector);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validates native's reply to `getCatalogExtensionIds`. Only a well-formed
 * reply counts as a catalog: anything else returns null, which the caller
 * treats as "catalog unknown" and keeps the button hidden. An empty list is a
 * valid answer (extension management is off), distinct from null.
 * @param {unknown} response
 * @returns {string[] | null}
 */
export function parseCatalogExtensionIds(response) {
    if (!isRecord(response)) return null;
    const { extensionIds } = response;
    if (!Array.isArray(extensionIds)) return null;
    if (!extensionIds.every((id) => typeof id === 'string')) return null;
    return extensionIds;
}

/**
 * @typedef {object} WebstorePrivate
 * @property {(extensionId: string, callback: (status?: string) => void) => void} getExtensionStatus
 * @property {Record<string, unknown>} [ExtensionInstallStatus]
 */

// Fallbacks for when the API's own ExtensionInstallStatus enum is unavailable;
// unmatched statuses keep the button hidden (fail closed)
const INSTALLED_STATUSES = ['enabled', 'disabled', 'force_installed', 'terminated'];
const INSTALLABLE_STATUSES = ['installable', 'can_request'];

/**
 * The chrome.webstorePrivate surface, or null when this browser doesn't expose
 * a usable one. Returns the narrowed API rather than a boolean so callers get
 * getExtensionStatus typed instead of reaching through `any`.
 * @param {unknown} chromeGlobal
 * @returns {WebstorePrivate | null}
 */
export function getWebstorePrivate(chromeGlobal) {
    if (!isRecord(chromeGlobal)) return null;
    const webstorePrivate = chromeGlobal.webstorePrivate;
    if (!isRecord(webstorePrivate)) return null;
    if (typeof webstorePrivate.getExtensionStatus !== 'function') return null;
    // Every field consumed has been checked above; the cast carries those findings
    return /** @type {WebstorePrivate} */ (/** @type {unknown} */ (webstorePrivate));
}

/**
 * Whether the last chrome.* call left an error pending. Reading the property is
 * also what marks the error as handled, so this must run inside the callback.
 * @param {unknown} chromeGlobal
 * @returns {boolean}
 */
export function hasRuntimeLastError(chromeGlobal) {
    if (!isRecord(chromeGlobal)) return false;
    const runtime = chromeGlobal.runtime;
    return isRecord(runtime) && runtime.lastError != null;
}

/**
 * Status values that map to each verdict, read from the API's own
 * ExtensionInstallStatus enum so we track Chromium; fallbacks only if it's missing.
 * @param {unknown} chromeGlobal
 * @returns {{ installable: string[], installed: string[] }}
 */
export function readStatusSets(chromeGlobal) {
    const statuses = getWebstorePrivate(chromeGlobal)?.ExtensionInstallStatus;
    const enumValues = isRecord(statuses) ? statuses : {};
    /**
     * @param {string[]} keys
     * @returns {string[]}
     */
    const collect = (keys) => {
        /** @type {string[]} */
        const found = [];
        for (const key of keys) {
            const value = enumValues[key];
            if (typeof value === 'string') found.push(value);
        }
        return found;
    };
    const installable = collect(['INSTALLABLE', 'CAN_REQUEST']);
    const installed = collect(['ENABLED', 'DISABLED', 'FORCE_INSTALLED', 'TERMINATED']);
    return {
        installable: installable.length ? installable : INSTALLABLE_STATUSES,
        installed: installed.length ? installed : INSTALLED_STATUSES,
    };
}
