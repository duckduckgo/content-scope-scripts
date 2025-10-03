import ContentFeature from '../content-feature';
import { getExpandedPerformanceMetrics, getJsPerformanceMetrics } from './breakage-reporting/utils.js';
import { isBeingFramed } from '../utils.js';

export default class PerformanceMetrics extends ContentFeature {
    init() {
        this.messaging.subscribe('getVitals', () => {
            const vitals = getJsPerformanceMetrics();
            this.messaging.notify('vitalsResult', { vitals });
        });

        // If the document is being framed, we don't want to collect expanded performance metrics
        if (isBeingFramed()) return;

        // If the feature is enabled, we want to collect expanded performance metrics
        if (this.getFeatureSettingEnabled('expandedPerformanceMetricsOnLoad', 'enabled')) {
            this.waitForPageLoad(() => {
                this.triggerExpandedPerformanceMetrics();
            });
        }
    }

    waitForPageLoad(callback) {
        if (document.readyState === 'complete') {
            callback();
        } else {
            window.addEventListener('load', callback, { once: true });
        }
    }

    async triggerExpandedPerformanceMetrics() {
        const expandedPerformanceMetrics = await getExpandedPerformanceMetrics();
        this.messaging.notify('expandedPerformanceMetricsResult', expandedPerformanceMetrics);
    }
}
