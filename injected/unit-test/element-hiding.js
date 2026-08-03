import { JSDOM } from 'jsdom';

// Polyfill browser globals needed by element-hiding module
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
if (typeof globalThis.DOMParser === 'undefined') {
    globalThis.DOMParser = dom.window.DOMParser;
}

const { default: ElementHiding } = await import('../src/features/element-hiding.js');

/**
 * Build feature args with element-hiding settings for the given domain.
 * @param {object} options
 * @param {string} options.domain
 * @param {any[]} [options.globalRules]
 * @param {any[]} [options.domains]
 * @returns {object}
 */
function buildArgs({ domain, globalRules = [], domains = [] }) {
    return {
        site: {
            domain,
            url: `http://${domain}`,
        },
        featureSettings: {
            elementHiding: {
                rules: globalRules,
                domains,
            },
        },
    };
}

describe('ElementHiding rule processing', () => {
    let originalApplyRules;
    beforeEach(() => {
        originalApplyRules = ElementHiding.prototype.applyRules;
        ElementHiding.prototype.applyRules = function () {};
    });
    afterEach(() => {
        ElementHiding.prototype.applyRules = originalApplyRules;
    });

    /**
     * @param {object} args
     * @returns {any[]}
     */
    function initAndGetRules(args) {
        const feature = new ElementHiding('elementHiding', {}, {}, args);
        feature.callInit(args);
        return /** @type {any[]} */ (feature.activeRules);
    }

    describe('domains with missing rules property', () => {
        it('should not throw when a domain entry has no rules property', () => {
            const args = buildArgs({
                domain: 'example.com',
                globalRules: [{ type: 'hide', selector: '.ad' }],
                domains: [{ domain: 'example.com' }],
            });
            const rules = initAndGetRules(args);
            expect(rules).toEqual([{ type: 'hide', selector: '.ad' }]);
        });

        it('should collect rules from domain entries that have them', () => {
            const args = buildArgs({
                domain: 'example.com',
                globalRules: [],
                domains: [{ domain: 'example.com', rules: [{ type: 'hide', selector: '.banner' }] }, { domain: 'example.com' }],
            });
            const rules = initAndGetRules(args);
            expect(rules).toEqual([{ type: 'hide', selector: '.banner' }]);
        });
    });

    describe('override rule filtering', () => {
        it('should remove global rules matching an override selector', () => {
            const args = buildArgs({
                domain: 'example.com',
                globalRules: [
                    { type: 'hide', selector: '.ad' },
                    { type: 'hide', selector: '.banner' },
                ],
                domains: [
                    {
                        domain: 'example.com',
                        rules: [{ type: 'override', selector: '.ad' }],
                    },
                ],
            });
            const rules = initAndGetRules(args);
            expect(rules.length).toBe(1);
            expect(rules[0].selector).toBe('.banner');
        });

        it('should preserve disable-default rules when filtering overrides', () => {
            const args = buildArgs({
                domain: 'example.com',
                globalRules: [{ type: 'hide', selector: '.ad' }],
                domains: [
                    {
                        domain: 'example.com',
                        rules: [{ type: 'disable-default' }, { type: 'hide', selector: '.ad' }, { type: 'override', selector: '.ad' }],
                    },
                ],
            });
            const rules = initAndGetRules(args);
            expect(rules.length).toBe(0);
        });

        it('should use type discriminant, not prototype-chain in-check, for selector filtering', () => {
            const polluted = Object.create({ selector: '.injected-via-prototype' });
            polluted.type = 'disable-default';

            const args = buildArgs({
                domain: 'example.com',
                globalRules: [{ type: 'hide', selector: '.ad' }],
                domains: [
                    {
                        domain: 'example.com',
                        rules: [polluted, { type: 'override', selector: '.injected-via-prototype' }],
                    },
                ],
            });
            const rules = initAndGetRules(args);
            // disable-default removes global rules; override filters by selector;
            // polluted rule is kept by override filter (type === 'disable-default')
            // then removed by disable-default filter → result is empty
            expect(rules.length).toBe(0);
        });

        it('should not remove non-selector rules via prototype pollution during override filtering', () => {
            const polluted = Object.create({ selector: '.ad' });
            polluted.type = 'disable-default';

            const args = buildArgs({
                domain: 'example.com',
                globalRules: [],
                domains: [
                    {
                        domain: 'example.com',
                        rules: [polluted, { type: 'hide', selector: '.banner' }, { type: 'override', selector: '.ad' }],
                    },
                ],
            });
            const rules = initAndGetRules(args);
            // disable-default removes global rules
            // override (.ad) only removes rules with matching own selector
            // polluted rule is preserved by override filter (type === 'disable-default')
            // then excluded by disable-default filter
            // .banner is kept, override is removed
            expect(rules.length).toBe(1);
            expect(rules[0].selector).toBe('.banner');
        });
    });

    describe('disable-default behavior', () => {
        it('should ignore global rules when disable-default is present', () => {
            const args = buildArgs({
                domain: 'example.com',
                globalRules: [{ type: 'hide', selector: '.global-ad' }],
                domains: [
                    {
                        domain: 'example.com',
                        rules: [{ type: 'disable-default' }, { type: 'hide', selector: '.local-ad' }],
                    },
                ],
            });
            const rules = initAndGetRules(args);
            expect(rules.length).toBe(1);
            expect(rules[0].selector).toBe('.local-ad');
        });

        it('should include global rules when disable-default is absent', () => {
            const args = buildArgs({
                domain: 'example.com',
                globalRules: [{ type: 'hide', selector: '.global-ad' }],
                domains: [
                    {
                        domain: 'example.com',
                        rules: [{ type: 'hide', selector: '.local-ad' }],
                    },
                ],
            });
            const rules = initAndGetRules(args);
            expect(rules.length).toBe(2);
            expect(rules.map((r) => r.selector)).toEqual(['.local-ad', '.global-ad']);
        });
    });
});
