import ContentFeature, { CallFeatureMethodError } from '../content-feature';
import { getExpandedPerformanceMetrics, getJsPerformanceMetrics } from './breakage-reporting/utils.js';
import { runBotDetection } from '../detectors/detections/bot-detection.js';
import { runFraudDetection } from '../detectors/detections/fraud-detection.js';
import { runAdwallDetection } from '../detectors/detections/adwall-detection.js';
import { runYoutubeAdDetection } from '../detectors/detections/youtube-ad-detection.js';

export default class BreakageReporting extends ContentFeature {
    init() {
        const isExpandedPerformanceMetricsEnabled = this.getFeatureSettingEnabled('expandedPerformanceMetrics', 'enabled');

        this.messaging.subscribe('getBreakageReportValues', async () => {
            // Payload that will be URL-encoded and passed directly through to breakage reports.
            const breakageDataPayload = {};

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

            // Run webDetection detectors for the breakageReport trigger
            const webDetectionResults = await this.callFeatureMethod('webDetection', 'runDetectors', { trigger: 'breakageReport' });
            if (!(webDetectionResults instanceof CallFeatureMethodError) && webDetectionResults.length > 0) {
                breakageDataPayload.webDetection = webDetectionResults;
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
            } else if (window.location.hostname === 'youtube.com' || window.location.hostname.endsWith('.youtube.com')) {
                // Run YouTube detector on YouTube even without full detectorSettings config
                result.detectorData = {
                    youtubeAds: runYoutubeAdDetection(undefined),
                };
            }

            if (isExpandedPerformanceMetricsEnabled) {
                const expandedPerformanceMetrics = await getExpandedPerformanceMetrics();
                if (expandedPerformanceMetrics.success) {
                    result.expandedPerformanceMetrics = expandedPerformanceMetrics.metrics;
                }
            }

            if (result.detectorData) {
                breakageDataPayload.detectorData = result.detectorData;
            }
            if (Object.keys(breakageDataPayload).length > 0) {
                try {
                    result.breakageData = encodeURIComponent(JSON.stringify(breakageDataPayload));
                } catch (e) {
                    // Send error indicator so we know encoding failed
                    result.breakageData = encodeURIComponent(JSON.stringify({ error: 'encoding_failed' }));
                }
            }

            this.messaging.notify('breakageReportResult', result);
        });
    }
}
