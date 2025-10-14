import ContentFeature from '../content-feature';

export default class WindowsBrandHints extends ContentFeature {
    init() {
        const brandsConfig = this.getFeatureSetting('brands');

        if (!brandsConfig || brandsConfig.length === 0) {
            return;
        }

        this.shimUserAgentDataBrands(brandsConfig);
    }

    /**
     * Override navigator.userAgentData.brands to match the Sec-CH-UA header we're sending.
     * @param {Array<{brand: string, version: string}>} brandsConfig - Array of brand objects from config
     */
    shimUserAgentDataBrands(brandsConfig) {
        try {
            if (!navigator.userAgentData || !navigator.userAgentData.brands) {
                return;
            }

            const originalBrands = navigator.userAgentData.brands;

            // Keep GREASE value from original brands
            const greaseValue = originalBrands.find(b => b.brand.includes('Not') && b.brand.includes('Brand'));

            const newBrands = [...brandsConfig];
            if (greaseValue) {
                newBrands.push(greaseValue);
            }

            // The brands property is on NavigatorUAData.prototype, not the instance
            const proto = Object.getPrototypeOf(navigator.userAgentData);

            this.wrapProperty(proto, 'brands', {
                get: () => newBrands
            });

            if (proto.getHighEntropyValues) {
                this.wrapMethod(proto, 'getHighEntropyValues', (originalFn, ...args) => {
                    return originalFn.apply(navigator.userAgentData, args).then(result => {
                        if (args[0] && args[0].includes('brands')) {
                            result.brands = newBrands;
                        }
                        return result;
                    });
                });
            }

        } catch (error) {
            // TODO: log error somewhere?
        }
    }
}