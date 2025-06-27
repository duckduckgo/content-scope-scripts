/**
 * Utility class for reporting metrics and exceptions to the native layer.
 *
 * This class provides standardized methods for sending metric events and exception reports
 * through the messaging system. It includes predefined metric names for common error types
 * and helper methods to construct and send metric events.
 *
 * Please see https://duckduckgo.github.io/content-scope-scripts/interfaces/shared_messages.reportmetricnotification
 * for the message schema
 *
 * @example
 * ```javascript
 * import { ReportMetric } from './report-metric.js';
 *
 * const metrics = new ReportMetric(messaging);
 *
 * // Report a custom metric
 * metrics.reportMetric({
 *     metricName: 'userAction',
 *     params: { action: 'buttonClick', page: 'home' }
 * });
 *
 * // Report an exception
 * metrics.reportException({
 *     message: 'Failed to load user data',
 *     kind: 'NetworkError'
 * });
 * ```
 *
 * @module Report Metric
 */

/**
 * @typedef {import('../shared/types/shared.ts').ExceptionMetric} ExceptionMetric
 * @typedef {import('../shared/types/shared.ts').ReportMetricEvent} ReportMetricEvent
 * @typedef {import('../shared/types/shared.ts').SharedMessages} SharedMessages
 * @typedef {import('@duckduckgo/messaging/lib/shared-types.js').MessagingBase<SharedMessages>|import('@duckduckgo/messaging').Messaging} SharedMessaging
 */

/** Exception kind for generic errors */
export const EXCEPTION_KIND_GENERIC_ERROR = 'Error';

/** Exception kind for initialization errors */
export const EXCEPTION_KIND_INIT_ERROR = 'InitError';

/** Exception kind for initial setup errors */
export const EXCEPTION_KIND_INITIAL_SETUP_ERROR = 'InitialSetupError';

/** Exception kind for messaging-related errors */
export const EXCEPTION_KIND_MESSAGING_ERROR = 'MessagingError';

/**
 * Class for reporting metrics and exceptions to the native layer.
 */
export class ReportMetric {
    /** The message ID used for reporting metrics to the native layer */
    static MESSAGE_ID = /** @type {const} */ ('reportMetric');

    /** The metric name used for exception reporting */
    static METRIC_NAME_EXCEPTION = /** @type {const} */ ('exception');

    /** The default exception message */
    static DEFAULT_EXCEPTION_MESSAGE = /** @type {const} */ ('Unknown error');

    /**
     * Creates a new ReportMetric instance.
     *
     * @param {SharedMessaging} messaging - The messaging instance used to communicate with the native layer
     * @throws {Error} When messaging is not provided or messaging.notify is not defined
     */
    constructor(messaging) {
        if (!messaging) {
            throw new Error('messaging is required');
        }
        this.messaging = messaging;
    }

    /**
     * Send a metric event to the native layer
     *
     * @param {ReportMetricEvent} metricEvent
     *
     * @throws {Error} When metricEvent.metricName is missing
     * @private
     */
    _sendMetric(metricEvent) {
        if (!metricEvent?.metricName) {
            throw new Error('metricName is required');
        }
        this.messaging.notify(ReportMetric.MESSAGE_ID, metricEvent);
    }

    /**
     * @typedef {Object} ExceptionMetricParams
     * @property {string} [message] - The exception message
     * @property {string} [kind] - The exception kind
     */

    /**
     * Creates an exception metric object. If message or kind parameters are not provided, default values
     * will be used.
     *
     * @param {ExceptionMetricParams} [params] - The exception parameters containing message and kind (both optional)
     * @returns {ExceptionMetric}
     * @private
     */
    _createExceptionMetric(params) {
        const message = params?.message && typeof params.message === 'string' ? params.message : ReportMetric.DEFAULT_EXCEPTION_MESSAGE;
        const kind = params?.kind && typeof params.kind === 'string' ? params.kind : EXCEPTION_KIND_GENERIC_ERROR;

        return {
            metricName: ReportMetric.METRIC_NAME_EXCEPTION,
            params: {
                message,
                kind,
            },
        };
    }

    /**
     * Sends a standard 'reportMetric' event to the native layer.
     *
     * @param {ReportMetricEvent} metricEvent - The metric event to report, must contain a metricName
     * @throws {Error} When metricEvent.metricName is missing
     *
     * @example
     * ```javascript
     * metrics.reportMetric({
     *     metricName: 'pageLoad',
     *     params: { duration: 1500, page: 'home' }
     * });
     * ```
     */
    reportMetric(metricEvent) {
        this._sendMetric(metricEvent);
    }

    /**
     * Sends a `reportMetric` event with metric name `exception`, getting `message` and `kind` from the `params` object. If no params object is passed, defaults are used.
     *
     *
     * @param {ExceptionMetricParams} [params] - The exception parameters containing message and kind (both optional)
     *
     * @example
     * ```javascript
     * // Report an exception with custom message and kind
     * metrics.reportException({
     *     message: 'Failed to fetch user data from API',
     *     kind: 'NetworkError'
     * });
     *
     * // Report an exception with default values (message: 'Unknown error', kind: 'Error')
     * metrics.reportException();
     * ```
     */
    reportException(params) {
        const metric = this._createExceptionMetric(params);
        this._sendMetric(metric);
    }

    /**
     * Sends a 'reportMetric' event with metric name 'exception', getting message and kind from the error object. If no error object is passed, a default error is reported.
     *
     * If an invalid error object is passed, nothing is reported.
     *
     * @param {Error} [error] - The error to report
     */
    reportExceptionWithError(error) {
        console.log('reportExceptionWithError', error instanceof Error);
        if (error && !(error instanceof Error)) {
            console.warn('reportExceptionWithError: error is not an Error object', error);
            return;
        }
        const metric = this._createExceptionMetric({ message: error?.message, kind: error?.name });
        this._sendMetric(metric);
    }
}
