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
 * Get the expanded performance metrics
 * @returns {ErrorObject | PerformanceMetricsResponse}
 */
export function getExpandedPerformanceMetrics() {
    try {
        if (document.readyState !== 'complete') {
            return returnError('Document not ready');
        }

        const navigation = /** @type {PerformanceNavigationTiming} */ (performance.getEntriesByType('navigation')[0]);
        const paint = performance.getEntriesByType('paint');
        const resources = /** @type {PerformanceResourceTiming[]} */ (performance.getEntriesByType('resource'));

        // Find FCP
        const fcp = paint.find(p => p.name === 'first-contentful-paint');

        // Get largest contentful paint if available
        let largestContentfulPaint = null;
        if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes &&
            PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
            const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
            if (lcpEntries.length > 0) {
                largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
            }
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
                    navigationType: navigation.type
                }
            };
        }

        return returnError('No navigation timing found');
    } catch (e) {
        return returnError('JavaScript execution error: ' + e.message);
    }
}