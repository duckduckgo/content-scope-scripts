/**
 * @typedef {import('../services/web-interference-detection/types/api.types.js').InterferenceDetectionRequest} InterferenceDetectionRequest
 */

import ContentFeature from '../content-feature.js';
import { createWebInterferenceService } from '../services/web-interference-detection/detector-service.js';
import { DEFAULT_INTERFERENCE_CONFIG } from '../services/web-interference-detection/default-config.js';

export default class WebInterferenceDetection extends ContentFeature {
    init() {
        const featureEnabled = this.getFeatureSettingEnabled('state');
        if (!featureEnabled) {
            return;
        }
        const interferenceConfig = this.getFeatureAttr('interferenceTypes', DEFAULT_INTERFERENCE_CONFIG);
        const service = createWebInterferenceService({
            interferenceConfig,
            onDetectionChange: (result) => {
                this.messaging.notify('interferenceChanged', result);
            },
        });

        /**
         * Example: One-time detection
         * Native ->  CSS: Call detectInterference
         * CSS -> Native: Return interferenceDetected with immediate results
         */
        this.messaging.subscribe('detectInterference', (/** @type {InterferenceDetectionRequest} */ request) => {
            try {
                const detectionResults = service.detect(request);
                return this.messaging.notify('interferenceDetected', detectionResults);
            } catch (error) {
                console.error('[WebInterferenceDetection] Detection failed:', error);
                return this.messaging.notify('interferenceDetectionError', { error: error.toString() });
            }
        });

        /**
         * Example: Continuous monitoring
         * Native -> CSS: Call startInterferenceMonitoring
         * CSS -> Native: Return monitoringStarted with initial results
         * CSS -> Native: Send interferenceChanged whenever detection changes (for types with observeDOMChanges: true)
         */
        this.messaging.subscribe('startInterferenceMonitoring', (/** @type {InterferenceDetectionRequest} */ request) => {
            try {
                service.detect(request);
            } catch (error) {
                console.error('[WebInterferenceDetection] Monitoring failed:', error);
                return this.messaging.notify('interferenceDetectionError', { error: error.toString() });
            }
        });
    }
}
