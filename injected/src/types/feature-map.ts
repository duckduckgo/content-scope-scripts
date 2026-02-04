/**
 * These types are auto-generated from feature files.
 * scripts/types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @internal
 * @module FeatureMap
 */

import type ApiManipulation from '../features/api-manipulation.js';
import type AutofillImport from '../features/autofill-import.js';
import type BreakageReporting from '../features/breakage-reporting.js';
import type BrokerProtection from '../features/broker-protection.js';
import type ClickToLoad from '../features/click-to-load.js';
import type Cookie from '../features/cookie.js';
import type DuckAiChatHistory from '../features/duck-ai-chat-history.js';
import type DuckAiDataClearing from '../features/duck-ai-data-clearing.js';
import type DuckPlayer from '../features/duck-player.js';
import type DuckPlayerNative from '../features/duck-player-native.js';
import type ElementHiding from '../features/element-hiding.js';
import type ExceptionHandler from '../features/exception-handler.js';
import type Favicon from '../features/favicon.js';
import type FingerprintingAudio from '../features/fingerprinting-audio.js';
import type FingerprintingBattery from '../features/fingerprinting-battery.js';
import type FingerprintingCanvas from '../features/fingerprinting-canvas.js';
import type FingerprintingHardware from '../features/fingerprinting-hardware.js';
import type FingerprintingScreenSize from '../features/fingerprinting-screen-size.js';
import type FingerprintingTemporaryStorage from '../features/fingerprinting-temporary-storage.js';
import type GoogleRejected from '../features/google-rejected.js';
import type Gpc from '../features/gpc.js';
import type HarmfulApis from '../features/harmful-apis.js';
import type MessageBridge from '../features/message-bridge.js';
import type NavigatorInterface from '../features/navigator-interface.js';
import type PageContext from '../features/page-context.js';
import type PerformanceMetrics from '../features/performance-metrics.js';
import type Print from '../features/print.js';
import type Referrer from '../features/referrer.js';
import type UaChBrands from '../features/ua-ch-brands.js';
import type WebCompat from '../features/web-compat.js';
import type WebDetection from '../features/web-detection.js';
import type WebInterferenceDetection from '../features/web-interference-detection.js';
import type WebTelemetry from '../features/web-telemetry.js';
import type WindowsPermissionUsage from '../features/windows-permission-usage.js';

/**
 * Map of feature names to feature class instances.
 * Auto-generated from src/features/*.js
 */
export interface FeatureMap {
    apiManipulation: ApiManipulation;
    autofillImport: AutofillImport;
    breakageReporting: BreakageReporting;
    brokerProtection: BrokerProtection;
    clickToLoad: ClickToLoad;
    cookie: Cookie;
    duckAiChatHistory: DuckAiChatHistory;
    duckAiDataClearing: DuckAiDataClearing;
    duckPlayer: DuckPlayer;
    duckPlayerNative: DuckPlayerNative;
    elementHiding: ElementHiding;
    exceptionHandler: ExceptionHandler;
    favicon: Favicon;
    fingerprintingAudio: FingerprintingAudio;
    fingerprintingBattery: FingerprintingBattery;
    fingerprintingCanvas: FingerprintingCanvas;
    fingerprintingHardware: FingerprintingHardware;
    fingerprintingScreenSize: FingerprintingScreenSize;
    fingerprintingTemporaryStorage: FingerprintingTemporaryStorage;
    googleRejected: GoogleRejected;
    gpc: Gpc;
    harmfulApis: HarmfulApis;
    messageBridge: MessageBridge;
    navigatorInterface: NavigatorInterface;
    pageContext: PageContext;
    performanceMetrics: PerformanceMetrics;
    print: Print;
    referrer: Referrer;
    uaChBrands: UaChBrands;
    webCompat: WebCompat;
    webDetection: WebDetection;
    webInterferenceDetection: WebInterferenceDetection;
    webTelemetry: WebTelemetry;
    windowsPermissionUsage: WindowsPermissionUsage;
}

export type FeatureName = keyof FeatureMap;
