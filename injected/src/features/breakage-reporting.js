import ContentFeature from '../content-feature';
import { getExpandedPerformanceMetrics, getJsPerformanceMetrics } from './breakage-reporting/utils.js';
import { runBotDetection } from '../detectors/detections/bot-detection.js';
import { runFraudDetection } from '../detectors/detections/fraud-detection.js';
import { runAdwallDetection } from '../detectors/detections/adwall-detection.js';
import { runYoutubeAdDetection } from '../detectors/detections/youtube-ad-detection.js';

export default class BreakageReporting extends ContentFeature {
    init() {
        const isExpandedPerformanceMetricsEnabled = this.getFeatureSettingEnabled('expandedPerformanceMetrics', 'enabled');

        this.messaging.subscribe('getBreakageReportValues', async () => {
            const jsPerformance = getJsPerformanceMetrics();
            const referrer = document.referrer;

            const result = {
                jsPerformance,
                referrer,
            };

            const getOpener = this.getFeatureSettingEnabled('opener', 'enabled');
            if (getOpener) {
                result.opener = !!window.opener;
            }
            const getReloaded = this.getFeatureSettingEnabled('reloaded', 'enabled');
            if (getReloaded) {
                result.pageReloaded =
                    (window.performance.navigation && window.performance.navigation.type === 1) ||
                    /** @type {PerformanceNavigationTiming[]} */
                    (window.performance.getEntriesByType('navigation')).map((nav) => nav.type).includes('reload');
            }

            // Only run detectors if explicitly configured
            // Fetch interferenceTypes from webInterferenceDetection feature settings
            const detectorSettings = this.getFeatureSetting('interferenceTypes', 'webInterferenceDetection');
            if (detectorSettings) {
                result.detectorData = {
                    botDetection: runBotDetection(detectorSettings.botDetection),
                    fraudDetection: runFraudDetection(detectorSettings.fraudDetection),
                    adwallDetection: runAdwallDetection(detectorSettings.adwallDetection),
                    youtubeAds: runYoutubeAdDetection(detectorSettings.youtubeAds),
                };
            }

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
