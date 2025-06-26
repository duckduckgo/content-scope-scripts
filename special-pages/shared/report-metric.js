/**
 * Utility module for reporting metrics and exceptions to the native layer.
 *
 * This module provides standardized functions for sending metric events and exception reports
 * through the messaging system. It includes predefined metric names for common error types
 * and helper functions to construct and send metric events.
 *
 * Please see https://duckduckgo.github.io/content-scope-scripts/interfaces/shared_messages.reportmetricnotification
 * for the message schema
 *
 * @example
 * ```javascript
 * import { reportMetric, reportException } from './report-metric.js';
 *
 * // Report a custom metric
 * reportMetric(messaging, {
 *     metricName: 'userAction',
 *     params: { action: 'buttonClick', page: 'home' }
 * });
 *
 * // Report an exception
 * reportException(messaging, {
 *     message: 'Failed to load user data',
 *     kind: 'NetworkError'
 * });
 * ```
 *
 * @module Report Metric
 */

/** The message ID used for reporting metrics to the native layer */
export const REPORT_METRIC_MESSAGE_ID = 'reportMetric';

/** The metric name used for exception reporting */
export const METRIC_NAME_EXCEPTION = 'exception';

/** Metric name for generic errors */
export const METRIC_NAME_GENERIC_ERROR = 'Error';

/** Metric name for initialization errors */
export const METRIC_NAME_INIT_ERROR = 'InitError';

/** Metric name for initial setup errors */
export const METRIC_NAME_INITIAL_SETUP_ERROR = 'InitialSetupError';

/** Metric name for messaging-related errors */
export const METRIC_NAME_MESSAGING_ERROR = 'MessagingError';

/** Metric name for video overlay errors */
export const METRIC_NAME_VIDEO_OVERLAY_ERROR = 'VideoOverlayError';

/**
 * @typedef {import('../shared/types/shared.ts').ExceptionMetric} ExceptionMetric
 * @typedef {import('../shared/types/shared.ts').ReportMetricEvent} ReportMetricEvent
 * @typedef {import('../shared/types/shared.ts').SharedMessages} SharedMessages
 * @typedef {import('@duckduckgo/messaging/lib/shared-types.js').MessagingBase<SharedMessages>|import('@duckduckgo/messaging').Messaging} SharedMessaging
 */

/**
 * Sends a standard 'reportMetric' event to the native layer.
 *
 * @param {SharedMessaging} messaging - The messaging instance used to communicate with the native layer
 * @param {ReportMetricEvent} metricEvent - The metric event to report, must contain a metricName
 * @throws {Error} When messaging.notify is not defined
 * @throws {Error} When metricEvent.metricName is missing
 *
 * @example
 * ```javascript
 * reportMetric(messaging, {
 *     metricName: 'pageLoad',
 *     params: { duration: 1500, page: 'home' }
 * });
 * ```
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
 * Sends a 'reportMetric' event with metric name 'exception'.
 *
 * This is a convenience function for reporting exceptions. It constructs
 * an exception metric with the provided parameters and sends it using the standard
 * reportMetric function. If message or kind parameters are not provided, default values
 * will be used.
 *
 * @param {SharedMessaging} messaging - The messaging instance used to communicate with the native layer
 * @param {{message?: string, kind?: string}} params - The exception parameters containing message and kind (both optional)
 *
 * @example
 * ```javascript
 * // Report an exception with custom message and kind
 * reportException(messaging, {
 *     message: 'Failed to fetch user data from API',
 *     kind: 'NetworkError'
 * });
 *
 * // Report an exception with default values (message: 'unknown error', kind: 'Error')
 * reportException(messaging, {});
 * ```
 */
export function reportException(messaging, params) {
    console.log('reportException', params);
    const message = typeof params?.message === 'string' ? params.message : 'unknown error';
    const kind = typeof params?.kind === 'string' ? params.kind : 'Error';

    /** @type {ExceptionMetric} */
    const metric = {
        metricName: METRIC_NAME_EXCEPTION,
        params: {
            message,
            kind,
        },
    };
    reportMetric(messaging, metric);
}
