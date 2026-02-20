import ContentFeature from '../content-feature';
import { DDGReflect } from '../utils';

export default class UaChBrands extends ContentFeature {
    /**
     * @param {string} featureName
     * @param {any} importConfig
     * @param {any} features
     * @param {any} args
     */
    constructor(featureName, importConfig, features, args) {
        super(featureName, importConfig, features, args);

        this.originalBrands = null;
    }

    init() {
        const shouldFilterWebView2 = this.getFeatureSettingEnabled('filterWebView2', 'enabled');
        const shouldOverrideEdge = this.getFeatureSettingEnabled('overrideEdge', 'enabled');

        if (!shouldFilterWebView2 && !shouldOverrideEdge) {
            this.log.info('Both filterWebView2 and overrideEdge disabled, skipping UA-CH-Brands modifications');
            return;
        }

        this.shimUserAgentDataBrands(shouldFilterWebView2, shouldOverrideEdge);
    }

    /**
     * Get the override target brand from domain settings or default to DuckDuckGo
     * @returns {string|null} - Brand name to use for replacement/append (null to skip override)
     */
    getBrandOverride() {
        const brandName = this.getFeatureSetting('brandName') || 'DuckDuckGo';
        if (brandName !== 'DuckDuckGo') {
            this.log.info(`Using brand override: "${brandName}"`);
        }
        return brandName;
    }

    /**
     * Override navigator.userAgentData.brands to match the Sec-CH-UA header
     * @param {boolean} shouldFilterWebView2 - Whether to filter WebView2
     * @param {boolean} shouldOverrideEdge - Whether to append/replace with target brand
     */
    shimUserAgentDataBrands(shouldFilterWebView2, shouldOverrideEdge) {
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

            const targetBrand = shouldOverrideEdge ? this.getBrandOverride() : null;
            const mutatedBrands = this.applyBrandMutationsToList(this.originalBrands, targetBrand, shouldFilterWebView2);

            if (mutatedBrands.length) {
                this.log.info(
                    'shimUserAgentDataBrands - about to apply override with:',
                    mutatedBrands.map((b) => `"${b.brand}" v${b.version}`).join(', '),
                );
                this.applyBrandsOverride(mutatedBrands, shouldOverrideEdge, shouldFilterWebView2);
                this.log.info('shimUserAgentDataBrands - override applied successfully');
            }
        } catch (error) {
            this.log.error('Error in shimUserAgentDataBrands:', error);
        }
    }

    /**
     * Filter out unwanted brands and append/replace with target brand to match Sec-CH-UA header
     * @param {Array<{brand: string, version: string}>} list - Original brands list
     * @param {string|null} targetBrand - Brand to use for replacement/append (null to skip override)
     * @param {boolean} [shouldFilterWebView2=true] - Whether to filter WebView2
     * @returns {Array<{brand: string, version: string}>} - Modified brands array
     */
    applyBrandMutationsToList(list, targetBrand, shouldFilterWebView2 = true) {
        if (!Array.isArray(list) || !list.length) {
            this.log.info('applyBrandMutationsToList - no brands to mutate');
            return [];
        }

        let mutated = [...list];

        if (shouldFilterWebView2) {
            mutated = mutated.filter((b) => b.brand !== 'Microsoft Edge WebView2');
            if (mutated.length < list.length) {
                this.log.info('Removed "Microsoft Edge WebView2" brand');
            }
        }

        if (targetBrand !== null) {
            const edgeIndex = mutated.findIndex((b) => b.brand === 'Microsoft Edge');
            if (edgeIndex !== -1) {
                const edgeVersion = mutated[edgeIndex].version;
                mutated[edgeIndex] = { brand: targetBrand, version: edgeVersion };
                this.log.info(`Replaced "Microsoft Edge" v${edgeVersion} with "${targetBrand}" v${edgeVersion}`);
            } else {
                const chromium = mutated.find((b) => b.brand === 'Chromium');
                if (chromium) {
                    mutated.push({ brand: targetBrand, version: chromium.version });
                    this.log.info(`Appended "${targetBrand}" v${chromium.version} (to match Chromium version)`);
                }
            }
        }

        const brandNames = mutated.map((b) => `"${b.brand}" v${b.version}`).join(', ');
        this.log.info(`Final brands: [${brandNames}]`);
        return mutated;
    }

    /**
     * Apply the brand override to navigator.userAgentData
     * @param {Array<{brand: string, version: string}>} newBrands - Brands to apply
     * @param {boolean} shouldOverrideEdge - Whether to replace/append brand
     * @param {boolean} shouldFilterWebView2 - Whether to filter WebView2
     */
    applyBrandsOverride(newBrands, shouldOverrideEdge, shouldFilterWebView2) {
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
            this.wrapMethod(proto, 'getHighEntropyValues', /** @this {any} */ async function (originalFn, ...args) {
                const originalResult = await DDGReflect.apply(originalFn, this, args);
                const modifiedResult = {};

                for (const [key, value] of Object.entries(originalResult)) {
                    let result = value;

                    if (key === 'brands' && args[0]?.includes('brands')) {
                        result = newBrands;
                    }
                    if (key === 'fullVersionList' && args[0]?.includes('fullVersionList') && value) {
                        const targetBrand = shouldOverrideEdge ? featureInstance.getBrandOverride() : null;
                        result = featureInstance.applyBrandMutationsToList(value, targetBrand, shouldFilterWebView2);
                    }

                    /** @type {Record<string, any>} */ (modifiedResult)[key] = result;
                }

                return modifiedResult;
            });
        }
    }
}
