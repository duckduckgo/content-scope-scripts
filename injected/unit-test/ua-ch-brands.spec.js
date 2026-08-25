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

    it('renames the existing brand instead of appending a second one', () => {
        const branded = [...chromiumBrands, { brand: 'DuckDuckGo', version: '151' }];

        const result = createFeature().applyBrandMutationsToList(branded, 'Chrome');

        expect(result).toEqual([...chromiumBrands, { brand: 'Chrome', version: '151' }]);
        expect(branded[2].brand).toBe('DuckDuckGo');
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
