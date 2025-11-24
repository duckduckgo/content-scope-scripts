import ContentFeature from '../content-feature';
import { DDGReflect } from '../utils';

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

            const mutatedBrands = this.applyBrandMutationsToList(this.originalBrands);

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
     * Replace Microsoft Edge with DuckDuckGo in the brands list to match Sec-CH-UA header
     * @param {Array<{brand: string, version: string}>} list
     * @returns {Array<{brand: string, version: string}>|null} - Modified brands or null if no changes
     */
    applyBrandMutationsToList(list) {
        if (!Array.isArray(list) || !list.length) {
            this.log.info('applyBrandMutationsToList - no brands to mutate');
            return null;
        }

        const mutated = list.filter((b) => b.brand !== 'Microsoft Edge WebView2');
        if (mutated.length < list.length) {
            this.log.info('Removed "Microsoft Edge WebView2" brand');
        }

        const edgeIndex = mutated.findIndex((b) => b.brand === 'Microsoft Edge');
        if (edgeIndex !== -1) {
            const edgeVersion = mutated[edgeIndex].version;
            mutated[edgeIndex] = { brand: 'DuckDuckGo', version: edgeVersion };
            this.log.info(`Replaced "Microsoft Edge" v${edgeVersion} with "DuckDuckGo" v${edgeVersion}`);
        } else {
            const chromium = mutated.find((b) => b.brand === 'Chromium');
            if (chromium) {
                mutated.push({ brand: 'DuckDuckGo', version: chromium.version });
                this.log.info(`Appended "DuckDuckGo" v${chromium.version} (to match Chromium version)`);
            } else {
                this.log.info('No Microsoft Edge or Chromium found, skipping DuckDuckGo addition');
                return null;
            }
        }

        const brandNames = mutated.map((b) => `"${b.brand}" v${b.version}`).join(', ');
        this.log.info(`Final brands: [${brandNames}]`);
        return mutated;
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
            // Need to capture feature instance in closure to access applyBrandMutationsToList
            // while preserving dynamic `this` (userAgentData) for DDGReflect.apply.
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const featureInstance = this;
            this.wrapMethod(proto, 'getHighEntropyValues', async function (originalFn, ...args) {
                const originalResult = await DDGReflect.apply(originalFn, this, args);
                const modifiedResult = {};

                for (const [key, value] of Object.entries(originalResult)) {
                    let result = value;

                    if (key === 'brands' && args[0]?.includes('brands')) {
                        result = newBrands;
                    }
                    if (key === 'fullVersionList' && args[0]?.includes('fullVersionList') && value) {
                        result = featureInstance.applyBrandMutationsToList(value);
                    }

                    modifiedResult[key] = result;
                }

                return modifiedResult;
            });
        }
    }
}
