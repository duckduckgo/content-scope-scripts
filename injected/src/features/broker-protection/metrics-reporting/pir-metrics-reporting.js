/** @typedef {import('@duckduckgo/messaging').Messaging} Messaging */
/** @typedef {import("./types").PirMetric} PirMetric */
/** @typedef {import("./types").ReportActionMetricParams} ReportActionMetricParams */
/** @typedef {import("../types").PirAction} PirAction */

import { ErrorResponse } from '../types';

const SUPPORTED_ACTIONS_FOR_PIR_METRICS = ['getCaptchaInfo', 'solveCaptcha'];

export class PirMetricsReporting {
    /**
     * @type {Messaging}
     * @internal
     */
    messaging;

    /**
     * @param {object} params
     * @param {Messaging} params.messaging - The messaging instance for communication.
     * @internal
     */
    constructor({ messaging }) {
        this.messaging = messaging;
    }

    /**
     * Reports a metric specifically related to a PIR action.
     * It extracts the necessary parameters from the action and result.
     * @param {ReportActionMetricParams} params
     */
    reportActionMetric(params) {
        const { action, result } = params;
        if (!this._isSupportedAction(action)) {
            return;
        }

        const metric = this._getMetricArgs({ action, result });
        if (metric) {
            this.reportMetric(metric);
        }
    }

    /**
     * Forwards a metric request to the native platform via the messaging system.
     * The native platform is responsible for actually firing the corresponding pixel/metric.
     * This follows the "Remote Delivery" pattern, allowing metrics to be defined in web code
     * and sent to the native layer without requiring native code changes for each new metric.
     *
     * @param {PirMetric} metric - The metric to report.
     *
     * @example <caption>Reporting a simple error</caption>
     * messaging.reportMetric('pir.action_error', {
     *   actionID: 'abc123',
     *   actionType: 'getCaptchaInfo',
     *   errorMessage: 'Network error'
     * });
     *
     * @example <caption>Including optional captchaType</caption>
     * messaging.reportMetric('pir.action_error', {
     *   actionID: 'def456',
     *   actionType: 'solveCaptcha',
     *   errorMessage: 'Timeout occurred',
     *   captchaType: 'hCaptcha'
     * });
     *
     * @see {@link PirMetric} - For the list of available metrics
     */
    reportMetric(metric) {
        this.messaging.notify('reportMetric', metric);
    }

    /**
     * @param {PirAction} action
     * @returns {boolean}
     * @internal
     */
    _isSupportedAction(action) {
        return SUPPORTED_ACTIONS_FOR_PIR_METRICS.includes(action.actionType);
    }

    /**
     * @param {ReportActionMetricParams} params
     * @returns {PirMetric | null}
     * @internal
     */
    _getMetricArgs(params) {
        const { action, result } = params;
        const { actionType, captchaType } = action;

        if (ErrorResponse.isErrorResponse(result)) {
            const { actionID, message: errorMessage } = result.error;
            return {
                metricName: 'pir.action_error',
                params: { actionID, actionType, errorMessage, ...(captchaType && { captchaType }) },
            };
        }

        return null;
    }
}
