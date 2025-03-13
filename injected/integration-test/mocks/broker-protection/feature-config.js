/**
 * @param {object} brokerProtection
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
