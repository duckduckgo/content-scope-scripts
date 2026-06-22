/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module AutofillPasskeys Messages
 */

/**
 * Requests, Notifications and Subscriptions from the AutofillPasskeys feature
 */
export interface AutofillPasskeysMessages {
  notifications: RegisterPasskeyRequestNotification;
  subscriptions: PasskeySelectedSubscription;
}
/**
 * Generated from @see "../messages/autofill-passkeys/registerPasskeyRequest.notify.json"
 */
export interface RegisterPasskeyRequestNotification {
  method: "registerPasskeyRequest";
  params: RegisterPasskeyRequestParams;
}
/**
 * Registers a pending conditional passkey request with native Autofill.
 */
export interface RegisterPasskeyRequestParams {
  /**
   * The relying party ID for the pending WebAuthn request.
   */
  rpId: string;
  /**
   * Opaque request ID echoed by the native passkey selection event.
   */
  requestId: string;
}
/**
 * Generated from @see "../messages/autofill-passkeys/passkeySelected.subscribe.json"
 */
export interface PasskeySelectedSubscription {
  subscriptionEvent: "passkeySelected";
  params: PasskeySelectedParams;
}
/**
 * Subscription payload sent when native Autofill selects a passkey for a pending request.
 */
export interface PasskeySelectedParams {
  /**
   * Base64-encoded (standard Base64, not Base64URL) WebAuthn credential ID selected by native Autofill.
   */
  credentialId: string;
  /**
   * Opaque request ID from the matching registerPasskeyRequest notification.
   */
  requestId: string;
}

declare module "../features/autofill-passkeys.js" {
  export interface AutofillPasskeys {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<AutofillPasskeysMessages>['notify'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<AutofillPasskeysMessages>['subscribe']
  }
}