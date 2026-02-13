import { isTrackerOrigin } from '../src/trackers.js';
import { setGlobal } from '../src/utils.js';

describe('isTrackerOrigin', () => {
    beforeEach(() => {
        // Set up a mock global with document.location
        setGlobal(
            /** @type {any} */ ({
                document: {
                    location: {
                        hostname: 'tracker.example.com',
                    },
                },
            }),
        );
    });

    it('returns true for a direct match in the trie', () => {
        const lookup = { com: { example: 1 } };
        expect(isTrackerOrigin(lookup, 'example.com')).toBeTrue();
    });

    it('returns true for a subdomain of a tracked domain', () => {
        const lookup = { com: { example: 1 } };
        expect(isTrackerOrigin(lookup, 'sub.example.com')).toBeTrue();
    });

    it('returns false for a non-tracked domain', () => {
        const lookup = { com: { example: 1 } };
        expect(isTrackerOrigin(lookup, 'other.com')).toBeFalse();
    });

    it('returns false for an empty trie', () => {
        expect(isTrackerOrigin({}, 'example.com')).toBeFalse();
    });

    it('navigates deeper trie structures', () => {
        const lookup = { com: { example: { tracker: 1 } } };
        expect(isTrackerOrigin(lookup, 'tracker.example.com')).toBeTrue();
        expect(isTrackerOrigin(lookup, 'example.com')).toBeFalse();
    });

    it('uses global hostname when no override provided', () => {
        const lookup = { com: { example: { tracker: 1 } } };
        expect(isTrackerOrigin(lookup)).toBeTrue();
    });

    it('returns false when traversal reaches a dead end', () => {
        const lookup = { com: { example: { sub: 1 } } };
        expect(isTrackerOrigin(lookup, 'other.example.com')).toBeFalse();
    });

    it('handles single-label hostnames', () => {
        const lookup = { localhost: 1 };
        expect(isTrackerOrigin(lookup, 'localhost')).toBeTrue();
    });

    it('returns false at end of trie without finding marker', () => {
        const lookup = { com: { example: { deep: { nested: {} } } } };
        expect(isTrackerOrigin(lookup, 'nested.deep.example.com')).toBeFalse();
    });
});
