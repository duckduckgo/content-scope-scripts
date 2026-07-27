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
    equal(getUpsellImpressionCount('model'), 0);
    recordUpsellImpression('model');
    equal(getUpsellImpressionCount('model'), 1);
});

test('each picker tracks its own count independently', () => {
    installFakeLocalStorage();
    recordUpsellImpression('model');
    recordUpsellImpression('model');
    recordUpsellImpression('reasoning');
    equal(getUpsellImpressionCount('model'), 2);
    equal(getUpsellImpressionCount('reasoning'), 1);
});

test('muting one picker does not mute the other', () => {
    installFakeLocalStorage();
    for (let view = 0; view < UPSELL_MUTE_THRESHOLD; view++) recordUpsellImpression('model');
    equal(isUpsellMuted('model'), true);
    equal(isUpsellMuted('reasoning'), false);
});

test('mutes only once the threshold has been reached', () => {
    installFakeLocalStorage();
    for (let view = 0; view < UPSELL_MUTE_THRESHOLD; view++) {
        equal(isUpsellMuted('reasoning'), false); // views 1..threshold stay un-muted
        recordUpsellImpression('reasoning');
    }
    equal(isUpsellMuted('reasoning'), true); // the next view is muted
});

test('the stored count is capped at the threshold', () => {
    installFakeLocalStorage();
    for (let view = 0; view < UPSELL_MUTE_THRESHOLD + 5; view++) recordUpsellImpression('model');
    equal(getUpsellImpressionCount('model'), UPSELL_MUTE_THRESHOLD);
});

test('a malformed stored value is treated as zero', () => {
    installFakeLocalStorage({ omnibar_upsell_impressions_model: 'not-a-number' });
    equal(getUpsellImpressionCount('model'), 0);
    equal(isUpsellMuted('model'), false);
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
    equal(getUpsellImpressionCount('model'), 0);
    equal(isUpsellMuted('model'), false);
    recordUpsellImpression('model'); // must not throw
});
