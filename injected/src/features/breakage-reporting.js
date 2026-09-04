import ContentFeature, { CallFeatureMethodError } from '../content-feature';
import { timeDetector } from './detector-perf.js';
import { getExpandedPerformanceMetrics, getJsPerformanceMetrics } from './breakage-reporting/utils.js';
import { runBotDetection, BOT_DETECTOR_NAME } from '../detectors/detections/bot-detection.js';
import { runFraudDetection, FRAUD_DETECTOR_NAME } from '../detectors/detections/fraud-detection.js';
import { runYoutubeAdDetection } from '../detectors/detections/youtube-ad-detection.js';

/**
 * @typedef {{
 *   jsPerformance: number[];
 *   referrer: string;
 *   opener?: boolean;
 *   pageReloaded?: boolean;
 *   detectorData?: object;
 *   expandedPerformanceMetrics?: unknown;
 *   breakageData?: string;
 * }} BreakageReportResult
 */

export default class BreakageReporting extends ContentFeature {
    init() {
        const isExpandedPerformanceMetricsEnabled = this.getFeatureSettingEnabled('expandedPerformanceMetrics', 'enabled');

        this.messaging.subscribe('getBreakageReportValues', async () => {
            // Payload that will be URL-encoded and passed directly through to breakage reports.
            const breakageDataPayload = /** @type {Record<string, unknown>} */ ({});

            const jsPerformance = getJsPerformanceMetrics();
            const referrer = document.referrer;

            /** @type {BreakageReportResult} */
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

            // Runs detector functions directly using webInterferenceDetection's config.
            // This means detectors execute in breakageReporting's world (apple-isolated),
            // not in webInterferenceDetection's world — so DOM checks work but window
            // property checks won't see page-script globals on Apple platforms.
            const detectorSettings = this.getFeatureSetting('interferenceTypes', 'webInterferenceDetection');
            if (detectorSettings) {
                result.detectorData = {
                    botDetection: timeDetector(this, BOT_DETECTOR_NAME, () => runBotDetection(detectorSettings.botDetection)),
                    fraudDetection: timeDetector(this, FRAUD_DETECTOR_NAME, () => runFraudDetection(detectorSettings.fraudDetection)),
                    // youtubeAds is intentionally not timed: the YouTube detector is
                    // excluded from detectorPerf and keeps its own internal metrics.
                    youtubeAds: runYoutubeAdDetection(detectorSettings.youtubeAds),
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

            // Exact per-detector timing accumulated over this page's lifetime
            // (detectorPerf events are bucketed; the report carries exact values).
            // Requested last so the record() calls queued by the timeDetector
            // wrappers above are applied before the snapshot is taken. That
            // ordering is guaranteed because every callFeatureMethod call to the
            // same feature awaits the same `_ready` promise, and continuations
            // on a shared promise run in FIFO subscription order — revisit this
            // if the dispatch mechanism ever stops funnelling through one await.
            const detectorPerfStats = await this.callFeatureMethod('detectorPerf', 'getStats');
            if (!(detectorPerfStats instanceof CallFeatureMethodError)) {
                breakageDataPayload.detectorPerf = detectorPerfStats;
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
