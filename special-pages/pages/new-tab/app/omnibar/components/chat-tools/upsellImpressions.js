const STORAGE_KEY = 'omnibar_upsell_impressions';
export const UPSELL_MUTE_THRESHOLD = 4;

/**
 * Reads how many times an upsell CTA has been shown. Combined count across both
 * pickers and both CTA types. Degrades to 0 if localStorage is unavailable.
 * @returns {number}
 */
export function getUpsellImpressionCount() {
    try {
        const n = parseInt(localStorage.getItem(STORAGE_KEY) ?? '', 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
        return 0;
    }
}

/**
 * True once the CTA has been seen `UPSELL_MUTE_THRESHOLD` times (mute from the next view on).
 * @returns {boolean}
 */
export function isUpsellMuted() {
    return getUpsellImpressionCount() >= UPSELL_MUTE_THRESHOLD;
}

/**
 * Record one impression (capped so the value never grows unbounded).
 */
export function recordUpsellImpression() {
    try {
        const next = Math.min(getUpsellImpressionCount() + 1, UPSELL_MUTE_THRESHOLD);
        localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
        /* localStorage unavailable — silently skip; CTA stays yellow */
    }
}
