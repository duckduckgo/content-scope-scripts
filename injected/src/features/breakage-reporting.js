import ContentFeature, { CallFeatureMethodError } from '../content-feature.js';
import { getExpandedPerformanceMetrics, getJsPerformanceMetrics } from './breakage-reporting/utils.js';
import { runBotDetection } from '../detectors/detections/bot-detection.js';
import { runFraudDetection } from '../detectors/detections/fraud-detection.js';
import { runYoutubeAdDetection } from '../detectors/detections/youtube-ad-detection.js';
// eslint-disable-next-line no-redeclare
import { CustomEvent, addEventListener, dispatchEvent } from '../captured-globals.js';

const DEBUG_REPORT_EVENT_TYPE = 'breakageReportDebug';
const DEBUG_REQUEST_EVENT_TYPE = 'breakageReportDebugRequest';

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
    /** True while a page request for report data is being collected */
    #debugRequestRunning = false;

    init() {
        this.messaging.subscribe('getBreakageReportValues', async () => {
            const result = await this.collectReport();
            this.messaging.notify('breakageReportResult', result);
            this._debugBroadcast('report', result);
        });

        if (this.isDebug) {
            addEventListener?.(DEBUG_REQUEST_EVENT_TYPE, async () => {
                if (this.#debugRequestRunning) return;
                this.#debugRequestRunning = true;
                try {
                    this._debugBroadcast('request', await this.collectReport());
                } catch {
                    // A failed collection leaves the page waiting, and the next request runs again
                } finally {
                    this.#debugRequestRunning = false;
                }
            });
        }
    }

    /**
     * Collect the breakage report values. Runs the webDetection detectors for the `breakageReport`
     * trigger, so a call is a real run: detectors that finish stay finished, and their actions run.
     *
     * @returns {Promise<BreakageReportResult>}
     */
    async collectReport() {
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
        try {
            await this.callFeatureMethod('webDetection', 'runDetectors', { trigger: 'breakageReport' });
        } catch {
            // A throw from the report run still leaves the entries earlier runs wrote
        }
        try {
            const webDetectionResults = await this.callFeatureMethod('webDetection', 'getBreakageReportData');
            if (!(webDetectionResults instanceof CallFeatureMethodError) && webDetectionResults.length > 0) {
                breakageDataPayload.webDetection = webDetectionResults;
            }
        } catch {
            // A throw from webDetection leaves its results out, and the rest of the report is still sent
        }

        // Runs detector functions directly using webInterferenceDetection's config.
        // This means detectors execute in breakageReporting's world (apple-isolated),
        // not in webInterferenceDetection's world — so DOM checks work but window
        // property checks won't see page-script globals on Apple platforms.
        const detectorSettings = this.getFeatureSetting('interferenceTypes', 'webInterferenceDetection');
        if (detectorSettings) {
            result.detectorData = {
                botDetection: runBotDetection(detectorSettings.botDetection),
                fraudDetection: runFraudDetection(detectorSettings.fraudDetection),
                // youtubeAds is intentionally not timed: the YouTube detector is
                // excluded from detectorPerf and keeps its own internal metrics.
                youtubeAds: runYoutubeAdDetection(detectorSettings.youtubeAds),
            };
        }

        if (this.getFeatureSettingEnabled('expandedPerformanceMetrics', 'enabled')) {
            const expandedPerformanceMetrics = await getExpandedPerformanceMetrics();
            if (expandedPerformanceMetrics.success) {
                result.expandedPerformanceMetrics = expandedPerformanceMetrics.metrics;
            }
        }

        if (result.detectorData) {
            breakageDataPayload.detectorData = result.detectorData;
        }

        // Exact webDetection timing accumulated in this frame
        // (detectorPerf events are bucketed; the report carries exact values).
        const detectorPerfStats = await this.callFeatureMethod('detectorPerf', 'getStats');
        if (!(detectorPerfStats instanceof CallFeatureMethodError) && detectorPerfStats != null) {
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

        return result;
    }

    /**
     * Debug-only page broadcast of a report's values, decoded, so test pages can show what a report
     * holds. Dispatched for a report the client asked for (`report`) and for a page's
     * `breakageReportDebugRequest` (`request`), which collects the values without sending them to the
     * client. The detail is a JSON string, as for the `webEventDebug` broadcast.
     *
     * INVARIANT: release builds never set the debug flag (`args.debug`) on user pages. Any page script
     * can read this event and send the request, and the debug flag is their only gate.
     *
     * @param {'report' | 'request'} source
     * @param {BreakageReportResult} result
     */
    _debugBroadcast(source, result) {
        if (!this.isDebug) return;
        try {
            const breakageData = result.breakageData ? JSON.parse(decodeURIComponent(result.breakageData)) : undefined;
            dispatchEvent?.(new CustomEvent(DEBUG_REPORT_EVENT_TYPE, { detail: JSON.stringify({ source, result, breakageData }) }));
        } catch {
            // The broadcast never affects the report sent to the client
        }
    }
}
