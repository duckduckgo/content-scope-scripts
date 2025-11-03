import ContentFeature from '../content-feature';

export default class UaChBrands extends ContentFeature {
    constructor(featureName, importConfig, args) {
        super(featureName, importConfig, args);

        this.cachedBrands = null;
        this.originalBrands = null;
    }

    init() {
        const configuredBrands = this.getFeatureSetting('brands');

        if (!configuredBrands || configuredBrands.length === 0) {
            this.log.info('No client hint brands correctly configured, feature disabled');
            return;
        }
        this.shimUserAgentDataBrands();
    }

    /**
     * Override navigator.userAgentData.brands to match the Sec-CH-UA header
     */
    shimUserAgentDataBrands() {
        try {
            // @ts-expect-error - userAgentData not yet standard
            if (!navigator.userAgentData || !navigator.userAgentData.brands) {
                return;
            }

            if (!this.originalBrands) {
                // @ts-expect-error - userAgentData not yet standard
                this.originalBrands = [...navigator.userAgentData.brands];
            }

            if (this.cachedBrands) {
                this.applyBrandsOverride(this.cachedBrands);
                return;
            }

            const mutatedBrands = this.applyBrandMutations();

            if (mutatedBrands) {
                this.cachedBrands = mutatedBrands;
                this.applyBrandsOverride(mutatedBrands);
            }
        } catch (error) {
            this.log.error('Error in shimUserAgentDataBrands:', error);
        }
    }

    /**
     * Find the GREASE brand value from original brands
     * @returns {{brand: string, version: string}|null} - GREASE brand or null if not found
     */
    findGreaseBrand() {
        if (!this.originalBrands || this.originalBrands.length === 0) {
            return null;
        }

        return this.originalBrands.find((brand) => {
            const name = brand.brand;
            // Check if it starts with "Not" or " Not" or contains special chars
            return name.trim().startsWith('Not') || /[^\w\s.]/.test(name);
        });
    }

    /**
     * Apply brand mutations using the configured brands from feature settings
     * Preserve the GREASE value from original brands at its original position
     * @returns {Array<{brand: string, version: string}>|null} - Configured brands or null if no changes
     */
    applyBrandMutations() {
        const configuredBrands = this.getFeatureSetting('brands');

        if (!configuredBrands || configuredBrands.length === 0) {
            this.log.info('No CH brands configured, skipping mutations');
            return null;
        }

        // Find GREASE value in original brands and preserve it
        const greaseBrand = this.findGreaseBrand();
        const greaseIndex = greaseBrand && this.originalBrands ? this.originalBrands.findIndex((b) => b.brand === greaseBrand.brand) : -1;

        if (greaseBrand && greaseIndex !== -1) {
            const result = [...configuredBrands];
            // Insert GREASE at its original position or end if out of bounds
            const insertAt = Math.min(greaseIndex, result.length);
            result.splice(insertAt, 0, greaseBrand);
            const brandNames = result.map(b => `"${b.brand}" v${b.version}`).join(', ');
            this.log.info(`Applying configured brands with GREASE at index ${insertAt}: [${brandNames}]`);
            return result;
        }

        const brandNames = configuredBrands.map(b => `"${b.brand}" v${b.version}`).join(', ');
        this.log.info(`Applying configured brands (no GREASE found): [${brandNames}]`);
        return configuredBrands;
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
