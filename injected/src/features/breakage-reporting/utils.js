/**
 * @returns array of performance metrics
 */
export function getJsPerformanceMetrics() {
    const paintResources = performance.getEntriesByType('paint');
    const firstPaint = paintResources.find((entry) => entry.name === 'first-contentful-paint');
    return firstPaint ? [firstPaint.startTime] : [];
}

/** @typedef {{error: string, success: false}} ErrorObject */
/** @typedef {{success: true, metrics: any}} PerformanceMetricsResponse */

/**
 * Convenience function to return an error object
 * @param {string} errorMessage
 * @returns {ErrorObject}
 */
function returnError(errorMessage) {
    return { error: errorMessage, success: false };
}

/**
 * @returns {Promise<number | null>}
 */
function waitForLCP(timeoutMs = 500) {
    return new Promise((resolve) => {
        /** @type {ReturnType<typeof setTimeout> | undefined} */
        let timeoutId; // eslint-disable-line prefer-const
        /** @type {PerformanceObserver | undefined} */
        let observer; // eslint-disable-line prefer-const

        const cleanup = () => {
            if (observer) observer.disconnect();
            if (timeoutId) clearTimeout(timeoutId);
        };

        // Set timeout
        timeoutId = setTimeout(() => {
            cleanup();
            resolve(null); // Resolve with null instead of hanging
        }, timeoutMs);

        // Try to get existing LCP
        observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                cleanup();
                resolve(lastEntry.startTime);
            }
        });

        try {
            observer.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (error) {
            // Handle browser compatibility issues
            cleanup();
            resolve(null);
        }
    });
}

/**
 * Get the expanded performance metrics
 * @returns {Promise<ErrorObject | PerformanceMetricsResponse>}
 */
export async function getExpandedPerformanceMetrics(timeoutMs = 500) {
    try {
        if (document.readyState !== 'complete') {
            return returnError('Document not ready');
        }

        const navigation = /** @type {PerformanceNavigationTiming} */ (performance.getEntriesByType('navigation')[0]);
        const paint = performance.getEntriesByType('paint');
        const resources = /** @type {PerformanceResourceTiming[]} */ (performance.getEntriesByType('resource'));

        // Find FCP
        const fcp = paint.find((p) => p.name === 'first-contentful-paint');

        // Get largest contentful paint if available
        let largestContentfulPaint = null;
        if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
            largestContentfulPaint = await waitForLCP(timeoutMs);
        }

        // Calculate total resource sizes
        const totalResourceSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

        if (navigation) {
            return {
                success: true,
                metrics: {
                    // Core timing metrics (in milliseconds)
                    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
                    domComplete: navigation.domComplete - navigation.fetchStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                    domInteractive: navigation.domInteractive - navigation.fetchStart,

                    // Paint metrics
                    firstContentfulPaint: fcp ? fcp.startTime : null,
                    largestContentfulPaint,

                    // Network metrics
                    timeToFirstByte: navigation.responseStart - navigation.fetchStart,
                    responseTime: navigation.responseEnd - navigation.responseStart,
                    serverTime: navigation.responseStart - navigation.requestStart,

                    // Size metrics (in octets)
                    transferSize: navigation.transferSize,
                    encodedBodySize: navigation.encodedBodySize,
                    decodedBodySize: navigation.decodedBodySize,

                    // Resource metrics
                    resourceCount: resources.length,
                    totalResourcesSize: totalResourceSize,

                    // Additional metadata
                    protocol: navigation.nextHopProtocol,
                    redirectCount: navigation.redirectCount,
                    navigationType: navigation.type,
                },
            };
        }

        return returnError('No navigation timing found');
    } catch (e) {
        return returnError('JavaScript execution error: ' + (e instanceof Error ? e.message : String(e)));
    }
}
