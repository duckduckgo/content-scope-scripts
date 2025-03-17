import { createFeatureConfig } from '../mocks/broker-protection/feature-config';

export const BROKER_PROTECTION_FEATURE_CONFIG_VARIATIONS = [
    createFeatureConfig({
        state: 'enabled',
        settings: {
            useEnhancedCaptchaSystem: 'enabled',
        },
    }),
    createFeatureConfig({
        state: 'enabled',
        settings: {
            useEnhancedCaptchaSystem: 'disabled',
        },
    }),
];
