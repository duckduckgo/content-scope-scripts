import { equal } from 'node:assert/strict';
import { test } from 'node:test';
import {
    getUpsellImpressionCount,
    isUpsellMuted,
    recordUpsellImpression,
    UPSELL_MUTE_THRESHOLD,
} from '../components/chat-tools/upsellImpressions.js';

/**
 * Installs an in-memory stand-in for `localStorage` (absent under `node --test`).
 * @param {Record<string, string>} [initial]
 */
function installFakeLocalStorage(initial = {}) {
    const store = new Map(Object.entries(initial));
    globalThis.localStorage = /** @type {any} */ ({
        getItem: (/** @type {string} */ k) => (store.has(k) ? store.get(k) : null),
        setItem: (/** @type {string} */ k, /** @type {string} */ v) => store.set(k, String(v)),
        removeItem: (/** @type {string} */ k) => store.delete(k),
        clear: () => store.clear(),
    });
}

test('count starts at zero and record() increments it', () => {
    installFakeLocalStorage();
    equal(getUpsellImpressionCount(), 0);
    recordUpsellImpression();
    equal(getUpsellImpressionCount(), 1);
});

test('mutes only once the threshold has been reached', () => {
    installFakeLocalStorage();
    for (let view = 0; view < UPSELL_MUTE_THRESHOLD; view++) {
        equal(isUpsellMuted(), false); // views 1..threshold stay un-muted
        recordUpsellImpression();
    }
    equal(isUpsellMuted(), true); // the next view is muted
});

test('the stored count is capped at the threshold', () => {
    installFakeLocalStorage();
    for (let view = 0; view < UPSELL_MUTE_THRESHOLD + 5; view++) recordUpsellImpression();
    equal(getUpsellImpressionCount(), UPSELL_MUTE_THRESHOLD);
});

test('a malformed stored value is treated as zero', () => {
    installFakeLocalStorage({ omnibar_upsell_impressions: 'not-a-number' });
    equal(getUpsellImpressionCount(), 0);
    equal(isUpsellMuted(), false);
});

test('degrades to un-muted when localStorage is unavailable', () => {
    globalThis.localStorage = /** @type {any} */ ({
        getItem() {
            throw new Error('unavailable');
        },
        setItem() {
            throw new Error('unavailable');
        },
    });
    equal(getUpsellImpressionCount(), 0);
    equal(isUpsellMuted(), false);
    recordUpsellImpression(); // must not throw
});
