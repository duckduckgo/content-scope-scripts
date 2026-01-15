import ContentFeature from '../content-feature';
import { getExpandedPerformanceMetrics, getJsPerformanceMetrics } from './breakage-reporting/utils.js';
import { isBeingFramed } from '../utils.js';

export default class PerformanceMetrics extends ContentFeature {
    init() {
        this.messaging.subscribe('getVitals', () => {
            const vitals = getJsPerformanceMetrics();
            this.messaging.notify('vitalsResult', { vitals });
        });

        // If the document is being framed, we don't want to collect metrics
        if (isBeingFramed()) return;

        // Listen for FCP and notify the app
        if (this.getFeatureSettingEnabled('firstContentfulPaint')) {
            this.observeFirstContentfulPaint();
        }

        // If the feature is enabled, we want to collect expanded performance metrics
        if (this.getFeatureSettingEnabled('expandedPerformanceMetricsOnLoad', 'enabled')) {
            this.waitForAfterPageLoad(() => {
                this.triggerExpandedPerformanceMetrics();
            });
        }
    }

    /**
     * Observes First Contentful Paint and notifies the native app when it occurs.
     * Uses buffered option to catch FCP if it already happened before observation started.
     */
    observeFirstContentfulPaint() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
                if (fcpEntry) {
                    this.messaging.notify('firstContentfulPaint', {
                        value: fcpEntry.startTime,
                    });
                    observer.disconnect();
                }
            });
            observer.observe({ type: 'paint', buffered: true });
        } catch (e) {
            // PerformanceObserver may not be available in all contexts
        }
    }

    waitForNextTask(callback) {
        setTimeout(callback, 0);
    }

    waitForAfterPageLoad(callback) {
        if (document.readyState === 'complete') {
            this.waitForNextTask(callback);
        } else {
            window.addEventListener(
                'load',
                () => {
                    this.waitForNextTask(callback);
                },
                { once: true },
            );
        }
    }

    async triggerExpandedPerformanceMetrics() {
        const permissableDelayMs = this.getFeatureSetting('expandedTimeoutMs') ?? 5000;
        const expandedPerformanceMetrics = await getExpandedPerformanceMetrics(permissableDelayMs);
        this.messaging.notify('expandedPerformanceMetricsResult', expandedPerformanceMetrics);
    }
}
