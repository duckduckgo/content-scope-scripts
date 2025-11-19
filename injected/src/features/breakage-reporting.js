import ContentFeature from '../content-feature';
import { getExpandedPerformanceMetrics, getJsPerformanceMetrics } from './breakage-reporting/utils.js';
import { runBotDetection } from '../detectors/detections/bot-detection.js';
import { runFraudDetection } from '../detectors/detections/fraud-detection.js';
import { DEFAULT_DETECTOR_SETTINGS } from '../detectors/default-config.js';

export default class BreakageReporting extends ContentFeature {
    init() {
        const isExpandedPerformanceMetricsEnabled = this.getFeatureSettingEnabled('expandedPerformanceMetrics', 'enabled');
        this.messaging.subscribe('getBreakageReportValues', async () => {
            const jsPerformance = getJsPerformanceMetrics();
            const referrer = document.referrer;

            // Get detector results (uses cached results from auto-run if available)
            const detectorData = {
                botDetection: runBotDetection(DEFAULT_DETECTOR_SETTINGS.botDetection),
                fraudDetection: runFraudDetection(DEFAULT_DETECTOR_SETTINGS.fraudDetection),
            };

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

