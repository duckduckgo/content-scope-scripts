import UaChBrands from '../src/features/ua-ch-brands.js';

function createFeature() {
    const feature = Object.create(UaChBrands.prototype);
    Object.defineProperty(feature, 'log', { value: { info: () => {}, error: () => {} } });
    return feature;
}

const chromiumBrands = [
    { brand: 'Chromium', version: '151' },
    { brand: 'Not=A?Brand', version: '99' },
];

function createFeatureForSite(site, exceptions = []) {
    const feature = createFeature();
    Object.defineProperty(feature, 'args', { value: { site } });
    Object.defineProperty(feature, 'bundledConfig', { value: { features: { uaChBrands: { exceptions } } } });
    return feature;
}

describe('UaChBrands stock-brand sites', () => {
    it('presents stock brands on a site the user allowlisted', () => {
        expect(createFeatureForSite({ allowlisted: true }).shouldPresentStockBrands()).toBeTrue();
    });

    it('presents stock brands on a site protections consider broken', () => {
        expect(createFeatureForSite({ isBroken: true }).shouldPresentStockBrands()).toBeTrue();
    });

    it('presents stock brands on a site excepted from this feature', () => {
        const top = globalThis.top;
        globalThis.top = /** @type {any} */ ({ location: { href: 'https://example.com/' } });

        try {
            expect(createFeatureForSite({}, [{ domain: 'example.com' }]).shouldPresentStockBrands()).toBeTrue();
            expect(createFeatureForSite({}, [{ domain: 'other.example' }]).shouldPresentStockBrands()).toBeFalse();
        } finally {
            globalThis.top = top;
        }
    });

    it('treats an ordinary site as brandable', () => {
        expect(createFeatureForSite({}).shouldPresentStockBrands()).toBeFalse();
    });

    it('removes the brand Chromium added, leaving the stock list', () => {
        const branded = [...chromiumBrands, { brand: 'DuckDuckGo', version: '151' }];

        const result = createFeature().removeOurBrandFromList(branded);

        expect(result).toEqual(chromiumBrands);
        expect(branded.length).toBe(3);
    });

    it('leaves an already stock list alone', () => {
        expect(createFeature().removeOurBrandFromList(chromiumBrands)).toEqual(chromiumBrands);
    });

    it('returns an empty list when there are no brands', () => {
        expect(createFeature().removeOurBrandFromList([])).toEqual([]);
    });
});

describe('UaChBrands applyBrandMutationsToList', () => {
    it('appends the target brand using the Chromium version', () => {
        const result = createFeature().applyBrandMutationsToList(chromiumBrands, 'DuckDuckGo');

        expect(result).toEqual([...chromiumBrands, { brand: 'DuckDuckGo', version: '151' }]);
    });

    it('leaves the list untouched when the target brand is already present', () => {
        const branded = [...chromiumBrands, { brand: 'DuckDuckGo', version: '151' }];

        const result = createFeature().applyBrandMutationsToList(branded, 'DuckDuckGo');

        expect(result).toEqual(branded);
    });

    it('replaces our brand instead of appending a second one', () => {
        const branded = [...chromiumBrands, { brand: 'DuckDuckGo', version: '151' }];

        const result = createFeature().applyBrandMutationsToList(branded, 'Chrome');

        expect(result).toEqual([...chromiumBrands, { brand: 'Chrome', version: '151' }]);
        expect(branded[2].brand).toBe('DuckDuckGo');
    });

    it('drops our brand when a different one is already present', () => {
        const both = [...chromiumBrands, { brand: 'DuckDuckGo', version: '151' }, { brand: 'Chrome', version: '151' }];

        const result = createFeature().applyBrandMutationsToList(both, 'Chrome');

        expect(result).toEqual([...chromiumBrands, { brand: 'Chrome', version: '151' }]);
    });

    it('returns an empty list when there are no brands', () => {
        expect(createFeature().applyBrandMutationsToList([], 'DuckDuckGo')).toEqual([]);
    });
});

describe('UaChBrands brandListsMatch', () => {
    it('is true for identical lists', () => {
        expect(createFeature().brandListsMatch(chromiumBrands, [...chromiumBrands])).toBeTrue();
    });

    it('is false when a brand differs', () => {
        const other = [
            { brand: 'Chromium', version: '151' },
            { brand: 'DuckDuckGo', version: '151' },
        ];

        expect(createFeature().brandListsMatch(chromiumBrands, other)).toBeFalse();
    });

    it('is false when the lengths differ', () => {
        const longer = [...chromiumBrands, { brand: 'DuckDuckGo', version: '151' }];

        expect(createFeature().brandListsMatch(chromiumBrands, longer)).toBeFalse();
    });
});
