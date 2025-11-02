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
        
        this.updateConfig();
        this.shimUserAgentDataBrands();
    }

    updateConfig() {
        // Clear cache when privacy config updated
        this.cachedBrands = null;
        this.log.info('Privacy remote config updated');
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
     * Apply brand mutations using the configured brands from feature settings
     * @returns {Array<{brand: string, version: string}>|null} - Configured brands or null if no changes
     */
    applyBrandMutations() {
        const configuredBrands = this.getFeatureSetting('brands');
        
        if (!configuredBrands || configuredBrands.length === 0) {
            this.log.info('No CH brands configured, skipping mutations');
            return null;
        }

        this.log.info('Applying configured brands:', configuredBrands);
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

        // Also override getHighEntropyValues on the prototype
        if (proto.getHighEntropyValues) {
            this.wrapMethod(proto, 'getHighEntropyValues', (originalFn, ...args) => {
                // @ts-expect-error - userAgentData not yet standard
                return originalFn.apply(navigator.userAgentData, args).then((result) => {
                    if (args[0] && args[0].includes('brands')) {
                        result.brands = newBrands;
                    }
                    return result;
                });
            });
        }
    }

    /**
     * Handle configuration updates (called when remote config changes)
     */
    update() {
        this.updateConfig();
        this.shimUserAgentDataBrands();
    }
}