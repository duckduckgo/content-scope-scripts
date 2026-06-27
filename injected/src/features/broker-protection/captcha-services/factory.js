/**
 * Factory for captcha providers
 */
export class CaptchaFactory {
    constructor() {
        this.providers = new Map();
    }

    /**
     * Register a captcha provider
     * @param {import('./providers/provider.interface').CaptchaProvider} provider - The provider to register
     * @param {Object} [options] - The optional provider options
     * @param {Array<string>} [options.aliases] - An optional list of aliases for that provider
     */
    registerProvider(provider, options) {
        this.providers.set(provider.getType(), provider);

        // Some captchas use the same DOM mechanisms to get the relevant captcha information, but
        // need to call dbp-api with a distinct captcha type.
        if (options?.aliases) {
            options?.aliases.forEach((alias) => {
                this.providers.set(alias, provider);
            });
        }
    }

    /**
     * Get a provider by type
     * @param {string} type - The provider type
     * @returns {import('./providers/provider.interface').CaptchaProvider|null}
     */
    getProviderByType(type) {
        return this.providers.get(type) || null;
    }

    /**
     * Detect the captcha provider based on the element
     * @param {Document | HTMLElement} root
     * @param {HTMLElement} element - The element to check
     * @returns {import('./providers/provider.interface').CaptchaProvider|null}
     */
    detectProvider(root, element) {
        return this._getAllProviders().find((provider) => provider.isSupportedForElement(root, element)) || null;
    }

    /**
     * Detect the captcha provider based on the root document
     * @param {HTMLElement} element - The element to check
     * @returns {import('./providers/provider.interface').CaptchaProvider|null}
     */
    detectSolveProvider(element) {
        return this._getAllProviders().find((provider) => provider.canSolve(element)) || null;
    }

    /**
     * Get all registered providers
     * @private
     * @returns {Array<import('./providers/provider.interface').CaptchaProvider>}
     */
    _getAllProviders() {
        // Aliases register the same provider instance under multiple keys, so deduplicate to
        // avoid running a provider's detection methods once per alias on the detection miss path.
        return Array.from(new Set(this.providers.values()));
    }
}
