import ContentFeature from '../content-feature';
import { getExpandedPerformanceMetrics, getJsPerformanceMetrics } from './breakage-reporting/utils.js';

export default class PerformanceMetrics extends ContentFeature {
    init() {
        this.messaging.subscribe('getVitals', () => {
            const vitals = getJsPerformanceMetrics();
            this.messaging.notify('vitalsResult', { vitals });
        });

        if (this.getFeatureSettingEnabled('expandedPerformanceMetricsOnLoad', 'enabled')) {
            document.addEventListener('load', () => {
                this.triggerExpandedPerformanceMetrics();
            });
        }

        if (this.getFeatureSettingEnabled('expandedPerformanceMetricsOnRequest', 'enabled')) {
            this.messaging.subscribe('getExpandedPerformanceMetrics', () => {
                this.triggerExpandedPerformanceMetrics();
            });
        }
    }

    triggerExpandedPerformanceMetrics() {
        const expandedPerformanceMetrics = getExpandedPerformanceMetrics();
        this.messaging.notify('expandedPerformanceMetricsResult', expandedPerformanceMetrics);
    }
}
