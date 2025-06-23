/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module Shared Messages
 */

export type ReportMetricEvent = ExceptionMetric;

/**
 * Requests, Notifications and Subscriptions from the Shared feature
 */
export interface SharedMessages {
  notifications: ReportMetricNotification;
}
/**
 * Generated from @see "../messages/reportMetric.notify.json"
 */
export interface ReportMetricNotification {
  method: "reportMetric";
  params: ReportMetricEvent;
}
export interface ExceptionMetric {
  metricName: "exception";
  params: {
    message: string;
  };
}
