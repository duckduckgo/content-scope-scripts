import ContentFeature from '../content-feature';
import { getExpandedPerformanceMetrics, getJsPerformanceMetrics } from './breakage-reporting/utils.js';

export default class BreakageReporting extends ContentFeature {
    init() {
        const isExpandedPerformanceMetricsEnabled = this.getFeatureSettingEnabled('expandedPerformanceMetrics', 'enabled');
        this.messaging.subscribe('getBreakageReportValues', () => {
            const jsPerformance = getJsPerformanceMetrics();
            const referrer = document.referrer;
            const result = {
                jsPerformance,
                referrer,
            };
            if (isExpandedPerformanceMetricsEnabled) {
                const expandedPerformanceMetrics = getExpandedPerformanceMetrics();
                if (expandedPerformanceMetrics.success) {
                    result.expandedPerformanceMetrics = expandedPerformanceMetrics.metrics;
                }
            }
            this.messaging.notify('breakageReportResult', result);
        });
    }
}
