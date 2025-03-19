/**
 * @param {object} brokerProtection
 * @param {'enabled' | 'disabled'} [brokerProtection.state] - optional state of the broker protection feature
 * @param {string[]} [brokerProtection.exceptions] - optional list of exceptions
 * @param {object} [brokerProtection.settings] - optional settings
 * @param {'enabled' | 'disabled'} [brokerProtection.settings.useEnhancedCaptchaSystem] - optional flag to use new action handlers
 */
export function createFeatureConfig(brokerProtection = {}) {
    return {
        unprotectedTemporary: [],
        features: {
            brokerProtection: {
                state: 'enabled',
                exceptions: [],
                settings: {},
                ...brokerProtection,
            },
        },
    };
}
