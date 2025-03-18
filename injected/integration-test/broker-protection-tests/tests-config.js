import { createFeatureConfig } from '../mocks/broker-protection/feature-config';

export const BROKER_PROTECTION_CONFIGS = Object.freeze({
    enhancedCaptchaSystemEnabled: createFeatureConfig({
        state: 'enabled',
        settings: {
            useEnhancedCaptchaSystem: 'enabled',
        },
    }),
    enhancedCaptchaSystemDisabled: createFeatureConfig({
        state: 'enabled',
        settings: {
            useEnhancedCaptchaSystem: 'disabled',
        },
    }),
});
