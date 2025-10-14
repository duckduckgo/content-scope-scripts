import ContentFeature from '../content-feature';

export default class WindowsBrandHints extends ContentFeature {
    init() {
        const brandsConfig = this.getFeatureSetting('brands');

        if (!brandsConfig || brandsConfig.length === 0) {
            return;
        }

        // Override navigator.userAgentData.brands to match what the browser sends in Sec-CH-UA header
        this.shimUserAgentDataBrands(brandsConfig);
    }

    /**
     * Override navigator.userAgentData.brands to match the Sec-CH-UA header
     * The header is already being modified at the browser level, this ensures JS sees consistent values
     * @param {Array<{brand: string, version: string}>} brandsConfig - Array of brand objects from config
     */
    shimUserAgentDataBrands(brandsConfig) {
        try {
            // Check if userAgentData exists and has brands property
            if (!navigator.userAgentData || !navigator.userAgentData.brands) {
                return;
            }

            const originalBrands = navigator.userAgentData.brands;

            // Keep GREASE value from original brands (e.g., "Not?A_Brand")
            const greaseValue = originalBrands.find(b => b.brand.includes('Not') && b.brand.includes('Brand'));

            // Build new brands array: our configured brands + GREASE
            const newBrands = [...brandsConfig];
            if (greaseValue) {
                newBrands.push(greaseValue);
            }

            // The brands property is on NavigatorUAData.prototype, not on the instance
            const proto = Object.getPrototypeOf(navigator.userAgentData);

            this.wrapProperty(proto, 'brands', {
                get: () => newBrands
            });

            // Also override getHighEntropyValues on the prototype
            if (proto.getHighEntropyValues) {
                this.wrapMethod(proto, 'getHighEntropyValues', (originalFn, ...args) => {
                    return originalFn.apply(navigator.userAgentData, args).then(result => {
                        // Override brands in high entropy values to match
                        if (args[0] && args[0].includes('brands')) {
                            result.brands = newBrands;
                        }
                        return result;
                    });
                });
            }

        } catch (error) {
            // Silently fail if shimming doesn't work - the browser will use its default behavior
        }
    }
}