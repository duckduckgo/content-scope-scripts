/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module DaxEasterEggLogos Messages
 */

/**
 * Requests, Notifications and Subscriptions from the DaxEasterEggLogos feature
 */
export interface DaxEasterEggLogosMessages {
  notifications: LogoUpdateNotification;
}
/**
 * Generated from @see "../messages/dax-easter-egg-logos/logoUpdate.notify.json"
 */
export interface LogoUpdateNotification {
  method: "logoUpdate";
  params: DaxEasterEggLogoUpdate;
}
export interface DaxEasterEggLogoUpdate {
  pageURL: string;
  logoURL: string | null;
}

declare module "../features/dax-easter-egg-logos.js" {
  export interface DaxEasterEggLogos {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DaxEasterEggLogosMessages>['notify']
  }
}