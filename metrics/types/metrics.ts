/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module MetricsMessages Messages
 */

export type ReportMetricEvent = ExceptionMetric;

/**
 * Requests, Notifications and Subscriptions from the MetricsMessages feature
 */
export interface MetricsMessagesMessages {
    notifications: ReportMetricNotification;
}
/**
 * Generated from @see "../messages/reportMetric.notify.json"
 */
export interface ReportMetricNotification {
    method: 'reportMetric';
    params: ReportMetricEvent;
}
export interface ExceptionMetric {
    metricName: 'exception';
    params: {
        message: string;
        kind?: string;
    };
}

declare module '../metrics-reporter.js' {
    export interface MetricsReporter {
        notify: import('@duckduckgo/messaging/lib/shared-types').MessagingBase<MetricsMessagesMessages>['notify'];
    }
}
