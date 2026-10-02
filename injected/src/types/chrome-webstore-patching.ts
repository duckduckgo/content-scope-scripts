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
  requests: GetCatalogExtensionIdsRequest;
}
/**
 * Generated from @see "../messages/chrome-webstore-patching/getCatalogExtensionIds.request.json"
 */
export interface GetCatalogExtensionIdsRequest {
  method: "getCatalogExtensionIds";
  params: GetCatalogExtensionIdsParams;
  result: GetCatalogExtensionIdsResponse;
}
/**
 * Asks native for the extension catalog the Chrome Web Store may offer. Takes no parameters.
 */
export interface GetCatalogExtensionIdsParams {}
/**
 * The extension catalog as resolved by native, after rollout, version and native-only gates.
 */
export interface GetCatalogExtensionIdsResponse {
  /**
   * Chrome Web Store extension IDs the store may offer for install. Empty when extension management is off, or before native config is ready.
   */
  extensionIds: string[];
}

declare module "../features/chrome-webstore-patching.js" {
  export interface ChromeWebstorePatching {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<ChromeWebstorePatchingMessages>['request']
  }
}