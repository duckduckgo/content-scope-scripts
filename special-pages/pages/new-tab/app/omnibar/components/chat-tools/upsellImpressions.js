/**
 * localStorage keys for the per-picker upsell impression counts. Each picker
 * tracks its own count so muting one picker's CTA doesn't mute the other's.
 * @type {Record<UpsellPicker, string>}
 */
const STORAGE_KEYS = {
    model: 'omnibar_upsell_impressions_model',
    reasoning: 'omnibar_upsell_impressions_reasoning',
};
export const UPSELL_MUTE_THRESHOLD = 4;

/**
 * Which picker an impression count belongs to.
 * @typedef {'model' | 'reasoning'} UpsellPicker
 */

/**
 * Reads how many times the given picker's upsell CTA has been shown.
 * Each picker keeps its own count. Degrades to 0 if localStorage is unavailable.
 * @param {UpsellPicker} picker
 * @returns {number}
 */
export function getUpsellImpressionCount(picker) {
    try {
        const n = parseInt(localStorage.getItem(STORAGE_KEYS[picker]) ?? '', 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
        return 0;
    }
}

/**
 * True once the given picker's CTA has been seen `UPSELL_MUTE_THRESHOLD` times
 * (mute from the next view on).
 * @param {UpsellPicker} picker
 * @returns {boolean}
 */
export function isUpsellMuted(picker) {
    return getUpsellImpressionCount(picker) >= UPSELL_MUTE_THRESHOLD;
}

/**
 * Record one impression for the given picker (capped so the value never grows unbounded).
 * @param {UpsellPicker} picker
 */
export function recordUpsellImpression(picker) {
    try {
        const next = Math.min(getUpsellImpressionCount(picker) + 1, UPSELL_MUTE_THRESHOLD);
        localStorage.setItem(STORAGE_KEYS[picker], String(next));
    } catch {
        /* localStorage unavailable — silently skip; CTA stays yellow */
    }
}
