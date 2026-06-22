import { applyCookiePolicyFallbacks } from '../src/features/cookie.js';

const DEFAULT_POLICY = { threshold: 604800, maxAge: 604800 };
const DEFAULT_TRACKER_POLICY = { threshold: 86400, maxAge: 86400 };

describe('applyCookiePolicyFallbacks', () => {
    it('fills null policy and trackerPolicy with defaults', () => {
        /** @type {{ policy: { threshold: number, maxAge: number } | null, trackerPolicy: { threshold: number, maxAge: number } | null }} */
        const state = { policy: null, trackerPolicy: null };
        applyCookiePolicyFallbacks(state);

        expect(state.policy).toEqual(DEFAULT_POLICY);
        expect(state.trackerPolicy).toEqual(DEFAULT_TRACKER_POLICY);
    });

    it('preserves explicit policy values', () => {
        const custom = { threshold: 3600, maxAge: 3600 };
        const customTracker = { threshold: 1800, maxAge: 1800 };
        /** @type {{ policy: { threshold: number, maxAge: number } | null, trackerPolicy: { threshold: number, maxAge: number } | null }} */
        const state = { policy: custom, trackerPolicy: customTracker };

        applyCookiePolicyFallbacks(state);

        expect(state.policy).toBe(custom);
        expect(state.trackerPolicy).toBe(customTracker);
    });

    it('only backfills the fields that are null', () => {
        const custom = { threshold: 7200, maxAge: 7200 };
        /** @type {{ policy: { threshold: number, maxAge: number } | null, trackerPolicy: { threshold: number, maxAge: number } | null }} */
        const state = { policy: custom, trackerPolicy: null };

        applyCookiePolicyFallbacks(state);

        expect(state.policy).toBe(custom);
        expect(state.trackerPolicy).toEqual(DEFAULT_TRACKER_POLICY);
    });

    it('honors custom fallback objects captured before a config merge', () => {
        const preserved = { threshold: 1200, maxAge: 1200 };
        /** @type {{ policy: { threshold: number, maxAge: number } | null, trackerPolicy: { threshold: number, maxAge: number } | null }} */
        const state = { policy: null, trackerPolicy: null };

        applyCookiePolicyFallbacks(state, { policy: preserved, trackerPolicy: preserved });

        expect(state.policy).toBe(preserved);
        expect(state.trackerPolicy).toBe(preserved);
    });
});
