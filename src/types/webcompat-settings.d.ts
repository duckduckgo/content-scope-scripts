/**
 * @module Webcompat Settings Schema
 * @description
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * See the privacy-configuration repo for the schema files:
 * https://github.com/duckduckgo/privacy-configuration
 * **DO NOT** edit this file directly as your changes will be lost.
 */

export type State = "enabled" | "disabled";
/**
 * List of domains with specific patch settings
 */
export type Domains = Domain[];

/**
 * Settings configuration for Web Compat
 */
export interface WebCompatSettings {
  windowSizing?: State;
  navigatorCredentials?: State;
  safariObject?: State;
  messageHandlers?: {
    state: State;
    handlerStrategies: {
      reflect: string[];
      polyfill: string[];
      undefined: string[];
    };
  };
  modifyLocalStorage?: {
    state: State;
    changes: {}[];
  };
  notification?: {
    state: State;
  };
  permissions?: {
    state: State;
    supportedPermissions: {};
  };
  mediaSession?: State;
  presentation?: State;
  webShare?: State;
  viewportWidth?:
    | State
    | {
        state: State;
        forcedDesktopValue?: string;
        forcedMobileValue?: string;
      };
  screenLock?: State;
  domains?: Domains;
  plainTextViewPort?: State;
}
export interface Domain {
  /**
   * Domain name
   */
  domain: string | string[];
  /**
   * List of operations to be applied on the settings for a specific domain
   */
  patchSettings: PatchSetting[];
}
export interface PatchSetting {
  /**
   * The operation to be performed
   */
  op: string;
  /**
   * The path of the setting to be patched
   */
  path: string;
  /**
   * The value to replace at the specified path
   */
  value: string | unknown[] | {} | number;
}
