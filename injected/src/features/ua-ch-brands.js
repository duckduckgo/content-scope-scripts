import ContentFeature from '../content-feature.js';
import { DDGReflect, getTabHostname, isGloballyDisabled, isUnprotectedDomain } from '../utils.js';

const DUCK_DUCK_GO_BRAND = 'DuckDuckGo';

export default class UaChBrands extends ContentFeature {
    constructor(featureName, importConfig, features, args) {
        super(featureName, importConfig, features, args);

        this.originalBrands = null;
    }

    init() {
        this.shimUserAgentDataBrands();
    }

    /**
     * Get the override target brand from domain settings or default to DuckDuckGo
     * @returns {string} - Brand name to use for replacement/append
     */
    getBrandOverride() {
        const brandName = this.getFeatureSetting('brandName') || DUCK_DUCK_GO_BRAND;
        if (brandName !== DUCK_DUCK_GO_BRAND) {
            this.log.info(`Using brand override: "${brandName}"`);
        }
        return brandName;
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

            const mutatedBrands = this.shouldPresentStockBrands()
                ? this.removeOurBrandFromList(this.originalBrands)
                : this.applyBrandMutationsToList(this.originalBrands, this.getBrandOverride());

            if (mutatedBrands.length && !this.brandListsMatch(this.originalBrands, mutatedBrands)) {
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
     * True when the site is meant to look exactly like the default browser, which means taking our
     * brand back out of whatever Chromium produced. That covers both a config exception and
     * protections being off, the two cases where this feature used to not run at all. Self-gating
     * means the framework no longer applies the exceptions for us, so they are read here - see
     * selfGatingFeatures.
     * @returns {boolean}
     */
    shouldPresentStockBrands() {
        if (this.args && isGloballyDisabled(this.args)) {
            return true;
        }

        const exceptions = this.bundledConfig?.features?.uaChBrands?.exceptions || [];
        return isUnprotectedDomain(getTabHostname(), exceptions);
    }

    /**
     * Drops our brand, leaving the list Chromium would have produced on its own.
     * @param {Array<{brand: string, version: string}>} list - Original brands list
     * @returns {Array<{brand: string, version: string}>} - List without our brand
     */
    removeOurBrandFromList(list) {
        if (!Array.isArray(list) || !list.length) {
            return [];
        }

        const remaining = list.filter((b) => b.brand !== DUCK_DUCK_GO_BRAND);
        if (remaining.length !== list.length) {
            this.log.info(`Removed "${DUCK_DUCK_GO_BRAND}" so the site sees the stock brands`);
        }
        return remaining;
    }

    /**
     * Ensure the brands list carries the target brand exactly once, using the Chromium version
     * @param {Array<{brand: string, version: string}>} list - Original brands list
     * @param {string} targetBrand - Brand name to apply
     * @returns {Array<{brand: string, version: string}>} - Modified brands array
     */
    applyBrandMutationsToList(list, targetBrand) {
        if (!Array.isArray(list) || !list.length) {
            this.log.info('applyBrandMutationsToList - no brands to mutate');
            return [];
        }

        // Our brand must not survive next to a different one, however it got there.
        const mutated = targetBrand === DUCK_DUCK_GO_BRAND ? [...list] : this.removeOurBrandFromList(list);

        if (!mutated.some((b) => b.brand === targetBrand)) {
            const chromium = mutated.find((b) => b.brand === 'Chromium');
            if (chromium) {
                mutated.push({ brand: targetBrand, version: chromium.version });
                this.log.info(`Appended "${targetBrand}" v${chromium.version} (to match Chromium version)`);
            }
        }

        const brandNames = mutated.map((b) => `"${b.brand}" v${b.version}`).join(', ');
        this.log.info(`Final brands: [${brandNames}]`);
        return mutated;
    }

    /**
     * @param {Array<{brand: string, version: string}>} a
     * @param {Array<{brand: string, version: string}>} b
     * @returns {boolean}
     */
    brandListsMatch(a, b) {
        return a.length === b.length && a.every((entry, index) => entry.brand === b[index].brand && entry.version === b[index].version);
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
                        result = featureInstance.shouldPresentStockBrands()
                            ? featureInstance.removeOurBrandFromList(value)
                            : featureInstance.applyBrandMutationsToList(value, featureInstance.getBrandOverride());
                    }

                    modifiedResult[key] = result;
                }

                return modifiedResult;
            });
        }
    }
}
