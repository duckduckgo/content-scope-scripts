/**
 * Core detection types for web interference detection service
 */

/**
 * @typedef {'botDetection' | 'youtubeAds' | 'fraudDetection'} InterferenceType
 */

/**
 * @typedef {'cloudflare' | 'hcaptcha'} VendorName
 */

/**
 * @typedef {'turnstile' | 'challengePage'} ChallengeType
 */

/**
 * @typedef {'cloudflareTurnstile' | 'cloudflareChallengePage' | 'hcaptcha'} ChallengeIdentifier
 */

/**
 * @typedef {'enabled' | 'disabled'} FeatureState
 */

/**
 * @typedef {object} StatusSelectorConfig
 * @property {string} status
 * @property {string[]} [selectors]
 * @property {string[]} [textPatterns]
 * @property {string[]} [textSources]
 */

/**
 * @typedef {object} ChallengeConfig
 * @property {FeatureState} state
 * @property {VendorName} vendor
 * @property {string[]} [selectors]
 * @property {string[]} [windowProperties]
 * @property {StatusSelectorConfig[]} [statusSelectors]
 * @property {boolean} [observeDOMChanges]
 */

/**
 * @typedef {Partial<Record<ChallengeIdentifier, ChallengeConfig>>} BotDetectionConfig
 */

/**
 * @typedef {object} AntiFraudAlertConfig
 * @property {FeatureState} state
 * @property {string} type
 * @property {string[]} [selectors]
 * @property {string[]} [textPatterns]
 * @property {string[]} [textSources]
 * @property {boolean} [observeDOMChanges]
 */

/**
 * @typedef {Record<string, AntiFraudAlertConfig>} AntiFraudConfig
 */

/**
 * @typedef {object} YouTubeAdsConfig
 * @property {string} rootSelector
 * @property {string[]} watchAttributes
 * @property {string[]} selectors
 * @property {string[]} adClasses
 * @property {string[]} [textPatterns]
 * @property {string[]} [textSources]
 * @property {number} [pollInterval]
 * @property {number} [rerootInterval]
 * @property {boolean} [observeDOMChanges]
 */

/**
 * @typedef {object} InterferenceSettings
 * @property {BotDetectionConfig} [botDetection]
 * @property {AntiFraudConfig} [fraudDetection]
 * @property {YouTubeAdsConfig} [youtubeAds]
 */

/**
 * @typedef {object} InterferenceConfig
 * @property {InterferenceSettings} settings
 */

/**
 * @typedef {object} VendorDetectionResult
 * @property {boolean} detected - Whether vendor was detected
 * @property {VendorName} vendor - Vendor identifier
 * @property {string} challengeType - Challenge identifier
 * @property {string | null} challengeStatus - Challenge status
 */

/**
 * @typedef {object} TypeDetectionResult
 * @property {boolean} detected
 * @property {InterferenceType} interferenceType
 * @property {Record<string, unknown>[]} [results]
 * @property {number} timestamp
 */

/**
 * @typedef {object} InterferenceDetector
 * @property {() => TypeDetectionResult} detect
 * @property {() => void} [stop]
 */

/**
 * @callback TypeDetectorFunction
 * @param {InterferenceConfig} interferenceConfig
 * @returns {TypeDetectionResult}
 */

/**
 * @typedef {object} DetectInterferenceParams
 * @property {InterferenceConfig} interferenceConfig
 * @property {((result: DetectionResults) => void)|null} [onDetectionChange]
 */

/**
 * @typedef {Partial<Record<InterferenceType, TypeDetectionResult>>} DetectionResults
 */

export {};
