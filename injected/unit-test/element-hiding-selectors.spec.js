import { forgivingSelector, querySelectorFor } from '../src/features/element-hiding-selectors.js';

describe('element-hiding selector helpers', () => {
    describe('forgivingSelector', () => {
        it('wraps a selector in :is()', () => {
            expect(forgivingSelector('.ad, .sponsored')).toBe(':is(.ad, .sponsored)');
        });
    });

    describe('querySelectorFor', () => {
        it('returns a single selector unchanged so browser indexing can apply', () => {
            expect(querySelectorFor('.hide-test')).toBe('.hide-test');
            expect(querySelectorFor(':ddg-nonexistent-pseudo-class')).toBe(':ddg-nonexistent-pseudo-class');
        });

        it('wraps comma-separated selector lists in :is() for forgiving matching', () => {
            expect(querySelectorFor('.valid, div:::malformed')).toBe(':is(.valid, div:::malformed)');
        });
    });
});
