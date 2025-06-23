export const REPORT_METRIC_MESSAGE_ID = 'reportMetric';
export const METRIC_NAME_EXCEPTION = 'exception';

/**
 * @typedef {import('../shared/types/shared.ts').SharedMessages} SharedMessages
 * @typedef {import('@duckduckgo/messaging/lib/shared-types.js').MessagingBase<SharedMessages>|import('@duckduckgo/messaging').Messaging} SharedMessaging
 */

/**
 * Sends a standard 'reportMetric' event to the native layer
 * @param {SharedMessaging} messaging
 * @param {import('../shared/types/shared.ts').ReportMetricEvent} metricEvent
 */
export function reportMetric(messaging, metricEvent) {
    if (!messaging?.notify) {
        throw new Error('messaging.notify is not defined');
    }

    if (!metricEvent?.metricName) {
        throw new Error('metricName is required');
    }

    messaging.notify(REPORT_METRIC_MESSAGE_ID, metricEvent);
}

/**
 * Sends a 'reportMetric' event with metric name 'exception'
 * @param {SharedMessaging} messaging
 * @param {import('../shared/types/shared.ts').ExceptionMetric['params']} params
 */
export function reportException(messaging, params) {
    reportMetric(messaging, { metricName: METRIC_NAME_EXCEPTION, params });
}
