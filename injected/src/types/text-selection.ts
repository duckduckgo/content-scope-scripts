/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module TextSelection Messages
 */

/**
 * Requests, Notifications and Subscriptions from the TextSelection feature
 */
export interface TextSelectionMessages {
  notifications: SelectionFrameChangedNotification;
  requests: IsEnabledRequest;
}
/**
 * Generated from @see "../messages/text-selection/selectionFrameChanged.notify.json"
 */
export interface SelectionFrameChangedNotification {
  method: "selectionFrameChanged";
  params: SelectionFrameChangedParams;
}
/**
 * Reports whether this frame has a selection without sending the selected text.
 */
export interface SelectionFrameChangedParams {
  /**
   * Whether this frame currently owns a non-empty selection.
   */
  hasSelection: boolean;
  /**
   * The event time expressed against the frame's performance time origin.
   */
  eventTimestamp: number;
}
/**
 * Generated from @see "../messages/text-selection/isEnabled.request.json"
 */
export interface IsEnabledRequest {
  method: "isEnabled";
  /**
   * Checks whether native text-selection tracking is enabled.
   */
  params: {
    [k: string]: unknown;
  };
}

declare module "../features/text-selection.js" {
  export interface TextSelection {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TextSelectionMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<TextSelectionMessages>['request']
  }
}