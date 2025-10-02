import { getExpandedPerformanceMetrics } from '../src/features/breakage-reporting/utils.js';

(async () => {
    const expandedPerformanceMetrics = await getExpandedPerformanceMetrics();
    return expandedPerformanceMetrics;
})();