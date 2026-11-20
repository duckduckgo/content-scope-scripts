import { createFeatureConfig } from '../mocks/broker-protection/feature-config';

export const BROKER_PROTECTION_CONFIGS = Object.freeze({
    default: createFeatureConfig(),
    visualizeActions: createFeatureConfig({ settings: { visualizeActions: 'enabled' } }),
});
