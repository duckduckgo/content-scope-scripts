import type { PirAction, ActionResponse } from '../types.js';

/**
 * All supported PIR metric names.
 */
export type PirMetricName = 'pir.action_error';

/**
 * Parameters for the 'pir.action_error' metric.
 * This metric is fired when a PIR action results in an error.
 */
export interface PirActionErrorParams {
    /** ID of the action that failed */
    actionID: string;
    /** Type of the action that failed */
    actionType: PirAction['actionType'];
    /** The error message reported by the action */
    errorMessage: string;
    /** Optional: The type of captcha involved (if applicable) */
    captchaType?: string;
}

/**
 * Maps PIR metric names to their corresponding parameter types.
 * This provides the typing relationship between metric names and expected parameters.
 */
export interface PirMetricParams {
    'pir.action_error': PirActionErrorParams;
}

/**
 * Represents a PIR metric to be reported.
 */
export interface PirMetric {
    /** The name of the metric to report */
    metricName: PirMetricName;
    /** The parameters for the metric */
    params: PirMetricParams[PirMetricName];
}

export interface ReportActionMetricParams {
    action: PirAction;
    result: ActionResponse;
}
