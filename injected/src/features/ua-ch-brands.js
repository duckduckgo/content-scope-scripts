import ContentFeature from '../content-feature';

export default class UaChBrands extends ContentFeature {
    constructor(featureName, importConfig, args) {
        super(featureName, importConfig, args);

        this.originalBrands = null;
    }

    init() {
        this.shimUserAgentDataBrands();
    }

    /**
     * Override navigator.userAgentData.brands to match the Sec-CH-UA header
     */
    shimUserAgentDataBrands() {
        try {
            // @ts-expect-error - userAgentData not yet standard
            if (!navigator.userAgentData || !navigator.userAgentData.brands) {
                this.log.info('shimUserAgentDataBrands - navigator.userAgentData not available');
                return;
            }

            // @ts-expect-error - userAgentData not yet standard
            this.originalBrands = [...navigator.userAgentData.brands];
            this.log.info(
                'shimUserAgentDataBrands - captured original brands:',
                this.originalBrands.map((b) => `"${b.brand}" v${b.version}`).join(', '),
            );

            const mutatedBrands = this.applyBrandMutations();

            if (mutatedBrands) {
                this.log.info(
                    'shimUserAgentDataBrands - about to apply override with:',
                    mutatedBrands.map((b) => `"${b.brand}" v${b.version}`).join(', '),
                );
                this.applyBrandsOverride(mutatedBrands);
                this.log.info('shimUserAgentDataBrands - override applied successfully');
            }
        } catch (error) {
            this.log.error('Error in shimUserAgentDataBrands:', error);
        }
    }

    /**
     * Apply brand mutations to any brand list (brands or fullVersionList)
     * Filters out WebView2 and replaces Edge with DuckDuckGo
     * @param {Array<{brand: string, version: string}>} brandList - Original brand list
     * @returns {Array<{brand: string, version: string}>} - Mutated brand list
     */
    applyBrandMutationsToList(brandList) {
        if (!brandList || brandList.length === 0) {
            return brandList;
        }

        // Filter out Microsoft Edge WebView2
        const result = brandList.filter((b) => b.brand !== 'Microsoft Edge WebView2');

        if (result.length < brandList.length) {
            this.log.info('Removed "Microsoft Edge WebView2" from list');
        }

        // Find and replace Microsoft Edge with DuckDuckGo (preserving version)
        const edgeIndex = result.findIndex((b) => b.brand === 'Microsoft Edge');
        if (edgeIndex !== -1) {
            const edgeVersion = result[edgeIndex].version;
            result[edgeIndex] = { brand: 'DuckDuckGo', version: edgeVersion };
            this.log.info(`Replaced "Microsoft Edge" with "DuckDuckGo" in list (version: ${edgeVersion})`);
        } else {
            // Append DuckDuckGo with Chromium's version if available
            const chromium = result.find((b) => b.brand === 'Chromium');
            if (chromium) {
                result.push({ brand: 'DuckDuckGo', version: chromium.version });
                this.log.info(`Appended "DuckDuckGo" to list (version: ${chromium.version})`);
            }
        }

        return result;
    }

    /**
     * Apply brand mutations by replacing Microsoft Edge with DuckDuckGo
     * This matches the native header manipulation behavior
     * @returns {Array<{brand: string, version: string}>|null} - Modified brands or null if no changes
     */
    applyBrandMutations() {
        if (!this.originalBrands || this.originalBrands.length === 0) {
            this.log.info('No original brands available, skipping mutations');
            return null;
        }

        const result = this.applyBrandMutationsToList(this.originalBrands);

        // Return null if no DuckDuckGo was added (nothing changed)
        if (!result.some((b) => b.brand === 'DuckDuckGo')) {
            this.log.info('No Microsoft Edge or Chromium found, skipping mutations');
            return null;
        }

        const brandNames = result.map((b) => `"${b.brand}" v${b.version}`).join(', ');
        this.log.info(`Final brands: [${brandNames}]`);
        return result;
    }

    /**
     * Apply the brand override to navigator.userAgentData
     * @param {Array<{brand: string, version: string}>} newBrands - Brands to apply
     */
    applyBrandsOverride(newBrands) {
        // @ts-expect-error - userAgentData not yet standard
        const proto = Object.getPrototypeOf(navigator.userAgentData);

        this.wrapProperty(proto, 'brands', {
            get: () => newBrands,
        });

        if (proto.getHighEntropyValues) {
            this.wrapMethod(proto, 'getHighEntropyValues', async (originalFn, ...args) => {
                // @ts-expect-error - userAgentData not yet standard
                const originalResult = await originalFn.apply(navigator.userAgentData, args);

                const modifiedResult = {};
                for (const [key, value] of Object.entries(originalResult)) {
                    let result = value;
                    if (key === 'brands' && args[0] && args[0].includes('brands')) {
                        result = newBrands;
                    }
                    if (key === 'fullVersionList' && args[0] && args[0].includes('fullVersionList')) {
                        result = this.applyBrandMutationsToList(value);
                    }
                    modifiedResult[key] = result;
                }
                return modifiedResult;
            });
        }
    }
}
