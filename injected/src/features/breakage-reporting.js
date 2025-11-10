import ContentFeature from '../content-feature';
import { getExpandedPerformanceMetrics, getJsPerformanceMetrics } from './breakage-reporting/utils.js';
import { getDetectorBatch } from '../detectors/detector-service.js';

export default class BreakageReporting extends ContentFeature {
    init() {
        const isExpandedPerformanceMetricsEnabled = this.getFeatureSettingEnabled('expandedPerformanceMetrics', 'enabled');
        this.messaging.subscribe('getBreakageReportValues', async () => {
            const jsPerformance = getJsPerformanceMetrics();
            const referrer = document.referrer;

            // Collect detector data
            const detectorData = await getDetectorBatch([
                'botDetection',
                'fraudDetection',
                'youtubeAds'
            ]);

            const result = {
                jsPerformance,
                referrer,
                detectorData,
            };
            if (isExpandedPerformanceMetricsEnabled) {
                const expandedPerformanceMetrics = await getExpandedPerformanceMetrics();
                if (expandedPerformanceMetrics.success) {
                    result.expandedPerformanceMetrics = expandedPerformanceMetrics.metrics;
                }
            }
            this.messaging.notify('breakageReportResult', result);
        });
    }
}
