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
 * Feature states that count as on for our purposes. 'internal' counts because
 * non-internal builds don't offer native extension installation either.
 * @param {unknown} state
 * @returns {boolean}
 */
function isStateOn(state) {
    return state === 'enabled' || state === 'internal';
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
 * Curated extension IDs from the native extensionManagement feature's
 * curatedExtensions sub-feature, read out of bundledConfig — sub-feature
 * settings aren't copied into featureSettings.
 *
 * Every unreadable shape returns an empty catalog, which the caller treats as
 * "nothing is installable": the parent feature gates native extension support,
 * so with it disabled a working install button must not be offered.
 * @param {unknown} bundledConfig
 * @returns {string[]}
 */
export function readCuratedCatalog(bundledConfig) {
    if (!isRecord(bundledConfig)) return [];
    const features = bundledConfig.features;
    if (!isRecord(features)) return [];

    const extensionManagement = features.extensionManagement;
    if (!isRecord(extensionManagement) || !isStateOn(extensionManagement.state)) return [];

    const subFeatures = extensionManagement.features;
    if (!isRecord(subFeatures)) return [];

    const curated = subFeatures.curatedExtensions;
    if (!isRecord(curated) || !isStateOn(curated.state)) return [];

    const settings = curated.settings;
    if (!isRecord(settings)) return [];

    const catalog = settings.catalog;
    if (!Array.isArray(catalog)) return [];

    /** @type {string[]} */
    const ids = [];
    for (const entry of catalog) {
        if (isRecord(entry) && typeof entry.id === 'string') ids.push(entry.id);
    }
    return ids;
}
