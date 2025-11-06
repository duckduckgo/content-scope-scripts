/**
 * @typedef {import('../types/detection.types.js').YouTubeAdsConfig} YouTubeAdsConfig
 * @typedef {import('../types/detection.types.js').TypeDetectionResult} TypeDetectionResult
 * @typedef {import('../types/detection.types.js').InterferenceDetector} InterferenceDetector
 */

import { DetectionBase } from './detection-base.js';
import { isVisible, queryAllSelectors } from '../utils/detection-utils.js';
import { createEmptyResult } from '../utils/result-factory.js';

/**
 * PROTOTYPE: YouTube ad detection
 * TODO: Add mutation-based detection, ad lifecycle tracking, sponsored content badges
 * @implements {InterferenceDetector}
 */
export class YouTubeAdsDetection extends DetectionBase {
    /**
     * @param {YouTubeAdsConfig} config
     * @param {((result: TypeDetectionResult) => void)|null} [onInterferenceChange]
     */
    constructor(config, onInterferenceChange = null) {
        super(config, onInterferenceChange);
        this.adCurrentlyPlaying = false;
    }

    /**
     * @returns {TypeDetectionResult}
     */
    detect() {
        const root = this.findRoot();
        if (!root) {
            return createEmptyResult('youtubeAds');
        }

        const hasAdClass = this.config.adClasses.some((/** @type {string} */ cls) => root.classList.contains(cls));
        const adElements = queryAllSelectors(this.config.selectors, root);
        const hasVisibleAdElement = adElements.some((el) => isVisible(el));

        const detected = hasAdClass || hasVisibleAdElement;

        return {
            detected,
            interferenceType: 'youtubeAds',
            results: detected
                ? [
                      {
                          adCurrentlyPlaying: true,
                          adType: 'video-ad',
                          source: 'one-time-detection',
                      },
                  ]
                : [],
            timestamp: Date.now(),
        };
    }

    findRoot() {
        return document.querySelector(this.config.rootSelector);
    }

    checkForInterference() {
        if (!this.root) {
            return;
        }

        const hadAd = this.adCurrentlyPlaying;
        const hasAdClass = this.config.adClasses.some((/** @type {string} */ cls) => this.root && this.root.classList.contains(cls));
        this.adCurrentlyPlaying = hasAdClass;

        if (this.onInterferenceChange && hadAd !== this.adCurrentlyPlaying) {
            this.onInterferenceChange(
                this.adCurrentlyPlaying
                    ? {
                          detected: true,
                          interferenceType: 'youtubeAds',
                          results: [
                              {
                                  adCurrentlyPlaying: true,
                                  adType: 'video-ad',
                                  source: 'detector',
                              },
                          ],
                          timestamp: Date.now(),
                      }
                    : createEmptyResult('youtubeAds'),
            );
        }
    }
}
