/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module ChromeWebstorePatching Messages
 */

/**
 * Requests, Notifications and Subscriptions from the ChromeWebstorePatching feature
 */
export interface ChromeWebstorePatchingMessages {
  requests: GetExtensionStatusRequest | InstallExtensionRequest | RemoveExtensionRequest;
  subscriptions: ExtensionRemovedSubscription;
}
/**
 * Generated from @see "../messages/chrome-webstore-patching/getExtensionStatus.request.json"
 */
export interface GetExtensionStatusRequest {
  method: "getExtensionStatus";
  params: GetExtensionStatusParams;
  result: GetExtensionStatusResponse;
}
/**
 * macOS: query native installation state for a curated extension.
 */
export interface GetExtensionStatusParams {
  /**
   * Chrome Web Store extension ID.
   */
  extensionId: string;
}
/**
 * macOS: native-authoritative status; unknown keeps the button hidden.
 */
export interface GetExtensionStatusResponse {
  status: "installable" | "installed" | "unsupported" | "unknown";
}
/**
 * Generated from @see "../messages/chrome-webstore-patching/installExtension.request.json"
 */
export interface InstallExtensionRequest {
  method: "installExtension";
  params: InstallExtensionParams;
  result: InstallExtensionResponse;
}
/**
 * macOS: ask native to download, validate and install a curated extension.
 */
export interface InstallExtensionParams {
  /**
   * Chrome Web Store extension ID.
   */
  extensionId: string;
  /**
   * Google CRX download endpoint URL. Native follows redirects and validates the package and source.
   */
  crxUrl: string;
}
/**
 * macOS: returned after completion and state update; false means failed or cancelled. The script then queries status again.
 */
export interface InstallExtensionResponse {
  success: boolean;
}
/**
 * Generated from @see "../messages/chrome-webstore-patching/removeExtension.request.json"
 */
export interface RemoveExtensionRequest {
  method: "removeExtension";
  params: RemoveExtensionParams;
  result: RemoveExtensionResponse;
}
/**
 * macOS: ask native to remove a curated extension.
 */
export interface RemoveExtensionParams {
  /**
   * Chrome Web Store extension ID.
   */
  extensionId: string;
}
/**
 * macOS: returned after completion and state update; false means failed or cancelled. The script then queries status again.
 */
export interface RemoveExtensionResponse {
  success: boolean;
}
/**
 * Generated from @see "../messages/chrome-webstore-patching/extensionRemoved.subscribe.json"
 */
export interface ExtensionRemovedSubscription {
  subscriptionEvent: "extensionRemoved";
  params: ExtensionRemovedParams;
}
/**
 * macOS: native reports that an extension was removed, after updating its stored status.
 */
export interface ExtensionRemovedParams {
  /**
   * Chrome Web Store ID of the removed extension.
   */
  extensionId: string;
}

declare module "../features/chrome-webstore-patching.js" {
  export interface ChromeWebstorePatching {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ChromeWebstorePatchingMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ChromeWebstorePatchingMessages>['subscribe']
  }
}