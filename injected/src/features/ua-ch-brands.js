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
     * Apply brand mutations by replacing Microsoft Edge with DuckDuckGo
     * This matches the native header manipulation behavior
     * @returns {Array<{brand: string, version: string}>|null} - Modified brands or null if no changes
     */
    applyBrandMutations() {
        if (!this.originalBrands || this.originalBrands.length === 0) {
            this.log.info('No original brands available, skipping mutations');
            return null;
        }

        // Start with a copy and filter out Microsoft Edge WebView2
        const result = this.originalBrands.filter((b) => b.brand !== 'Microsoft Edge WebView2');
        
        if (result.length < this.originalBrands.length) {
            this.log.info('Removed "Microsoft Edge WebView2" brand');
        }

        const edgeIndex = result.findIndex((b) => b.brand === 'Microsoft Edge');

        if (edgeIndex !== -1) {
            // Replace Microsoft Edge with DuckDuckGo (keep version)
            const edgeVersion = result[edgeIndex].version;
            result[edgeIndex] = { brand: 'DuckDuckGo', version: edgeVersion };
            this.log.info(`Replaced "Microsoft Edge" v${edgeVersion} with "DuckDuckGo" v${edgeVersion}`);
        } else {
            // Append DuckDuckGo with Chromium's version if available
            const chromium = result.find((b) => b.brand === 'Chromium');
            if (chromium) {
                result.push({ brand: 'DuckDuckGo', version: chromium.version });
                this.log.info(`Appended "DuckDuckGo" v${chromium.version} (using Chromium version)`);
            } else {
                this.log.info('No Microsoft Edge or Chromium found, skipping DuckDuckGo addition');
                return null;
            }
        }

        const brandNames = result.map((b) => `"${b.brand}" v${b.version}`).join(', ');
        this.log.info(`Final brands: [${brandNames}]`);
        return result;
    }

    /**
     * Apply the brand override to navigator.userAgentData.brands
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
                const result = await originalFn.apply(navigator.userAgentData, args);
                if (args[0] && args[0].includes('brands')) {
                    result.brands = newBrands;
                }
                return result;
            });
        }
    }
}
