// eslint-disable
/**
 * @module Duckplayer Settings Schema
 * @description
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * See the privacy-configuration repo for the schema files:
 * https://github.com/duckduckgo/privacy-configuration
 * **DO NOT** edit this file directly as your changes will be lost.
 */

export type State = "enabled" | "disabled";

/**
 * Settings configuration for video player
 */
export interface DuckPlayerSettings {
  overlays: Overlays;
  /**
   * List of domains with specific patch settings
   */
  domains: Domain[];
}
/**
 * Specific configurations for different overlay types
 */
export interface Overlays {
  youtube: YouTubeOverlay;
  serpProxy: SERPProxy;
}
/**
 * Configuration specific to YouTube overlays
 */
export interface YouTubeOverlay {
  state: State;
  selectors: Selectors;
  thumbnailOverlays: ThumbnailOverlays;
  clickInterception: ClickInterception;
  videoOverlays: VideoOverlays;
}
/**
 * CSS selectors for identifying specific HTML elements on a YouTube page
 */
export interface Selectors {
  /**
   * CSS selector for YouTube thumbnail links
   */
  thumbLink: string;
  /**
   * CSS selectors for regions to exclude from hover/click interactions
   */
  excludedRegions: string[];
  /**
   * CSS selector for the video element on YouTube
   */
  videoElement: string;
  /**
   * CSS selector for the container of the video element
   */
  videoElementContainer: string;
}
/**
 * Settings related to the display of thumbnail overlays
 */
export interface ThumbnailOverlays {
  state: State;
}
/**
 * Settings for intercepting click events
 */
export interface ClickInterception {
  state: State;
}
/**
 * Settings related to the display of video overlays
 */
export interface VideoOverlays {
  state: State;
}
/**
 * Configuration for the SERP (Search Engine Results Page) proxy
 */
export interface SERPProxy {
  state: State;
}
export interface Domain {
  /**
   * Domain name
   */
  domain: string;
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
  value: string;
}
