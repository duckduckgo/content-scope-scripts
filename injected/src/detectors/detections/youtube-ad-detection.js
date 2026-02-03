import { isVisible, toRegExpArray } from '../utils/detection-utils.js';

/**
 * @typedef {Object} YouTubeDetectorConfig
 * @property {string} [state] - Feature state: 'enabled', 'disabled', or 'internal'
 * @property {string[]} playerSelectors - Selectors for the player root element
 * @property {string[]} adClasses - CSS classes that indicate ads
 * @property {string[]} adTextPatterns - Text patterns (regex) that indicate ads
 * @property {number} sweepIntervalMs - How often to check for ads/buffering (ms)
 * @property {number} slowLoadThresholdMs - Threshold for counting slow loads as buffering (ms)
 * @property {{background: string, thumbnail: string, image: string}} staticAdSelectors
 * @property {string[]} playabilityErrorSelectors
 * @property {string[]} playabilityErrorPatterns
 * @property {string[]} adBlockerDetectionSelectors
 * @property {string[]} adBlockerDetectionPatterns
 * @property {{signInButton: string, avatarButton: string, premiumLogo: string}} loginStateSelectors
 */

/**
 * YouTube Ad Detector
 * Detects ads, buffering, playability errors, and ad blocker detection on YouTube
 * All configuration comes from privacy-config - no hardcoded defaults
 */
class YouTubeAdDetector {
    /**
     * @param {YouTubeDetectorConfig} config - Configuration from privacy-config (required)
     */
    constructor(config) {
        // All config comes from privacy-config
        this.config = {
            playerSelectors: config.playerSelectors,
            adClasses: config.adClasses,
            adTextPatterns: config.adTextPatterns,
            sweepIntervalMs: config.sweepIntervalMs,
            slowLoadThresholdMs: config.slowLoadThresholdMs,
            staticAdSelectors: config.staticAdSelectors,
            playabilityErrorSelectors: config.playabilityErrorSelectors,
            playabilityErrorPatterns: config.playabilityErrorPatterns,
            adBlockerDetectionSelectors: config.adBlockerDetectionSelectors,
            adBlockerDetectionPatterns: config.adBlockerDetectionPatterns,
            loginStateSelectors: config.loginStateSelectors,
        };

        // Initialize state
        this.state = this.createInitialState();

        // Intervals and tracking
        this.pollInterval = null;
        this.rerootInterval = null;
        this.trackedVideoElement = null;
        this.lastLoggedVideoId = null;
        this.currentVideoId = null;
        this.videoLoadStartTime = null;
        this.bufferingStartTime = null;
        this.lastSweepTime = null;
        this.lastSeekTime = null;
        this.lastUrl = location.href;
        this.playerRoot = null;

        // Store original history methods for cleanup
        this.originalPushState = null;
        this.originalReplaceState = null;

        // Compiled regex patterns
        this.adTextPatterns = toRegExpArray(this.config.adTextPatterns);
        this.playabilityErrorPatterns = toRegExpArray(this.config.playabilityErrorPatterns);
        this.adBlockerDetectionPatterns = toRegExpArray(this.config.adBlockerDetectionPatterns);
    }

    // =========================================================================
    // State Management
    // =========================================================================

    createInitialState() {
        return {
            detections: {
                videoAd: { count: 0, showing: false },
                staticAd: { count: 0, showing: false },
                playabilityError: { count: 0, showing: false, /** @type {string|null} */ lastMessage: null },
                adBlocker: { count: 0, showing: false },
            },
            buffering: {
                count: 0,
                /** @type {number[]} */ durations: [],
            },
            videoLoads: 0,
            /** @type {{state: string, isPremium: boolean, rawIndicators: Object}|null} */ loginState: null,
            perfMetrics: {
                /** @type {number[]} */ sweepDurations: [],
                /** @type {number[]} */ adCheckDurations: [],
                sweepCount: 0,
                /** @type {number[]} */ top5SweepDurations: [],
                /** @type {number[]} */ top5AdCheckDurations: [],
                sweepsOver10ms: 0,
                sweepsOver50ms: 0,
            },
        };
    }

    /**
     * Report a detection event
     * @param {'videoAd'|'staticAd'|'playabilityError'|'adBlocker'} type
     * @param {Object} [details]
     * @returns {boolean} Whether detection was new
     */
    reportDetection(type, details = {}) {
        const typeState = this.state.detections[type];

        if (typeState.showing) {
            if (!details.message || typeState.lastMessage === details.message) {
                return false;
            }
        }

        typeState.showing = true;
        typeState.count++;
        if (details.message && 'lastMessage' in typeState) {
            typeState.lastMessage = details.message;
        }

        return true;
    }

    /**
     * Clear a detection state
     * @param {'videoAd'|'staticAd'|'playabilityError'|'adBlocker'} type
     */
    clearDetection(type) {
        const typeState = this.state.detections[type];
        if (!typeState.showing) return;

        typeState.showing = false;
        if ('lastMessage' in typeState) {
            typeState.lastMessage = null;
        }
    }

    // =========================================================================
    // Main Detection Loop
    // =========================================================================

    /**
     * Run one sweep of all detection checks
     * Called periodically by the poll interval
     */
    sweep() {
        const sweepStart = performance.now();

        this.lastSweepTime = sweepStart;

        const root = this.findPlayerRoot();
        if (!root) return;

        // Re-attach video listeners if needed
        this.attachVideoListeners(root);

        // Check for video ads
        const adCheckStart = performance.now();
        const hasVideoAd = this.checkForVideoAds(root);
        const adCheckDuration = performance.now() - adCheckStart;

        if (hasVideoAd && !this.state.detections.videoAd.showing) {
            this.reportDetection('videoAd');
        } else if (!hasVideoAd && this.state.detections.videoAd.showing) {
            this.clearDetection('videoAd');
        }

        // Check for static ads
        const hasStaticAd = this.checkForStaticAds();
        if (hasStaticAd && !this.state.detections.staticAd.showing) {
            this.reportDetection('staticAd');
        } else if (!hasStaticAd && this.state.detections.staticAd.showing) {
            this.clearDetection('staticAd');
        }

        // Check for playability errors
        const playabilityError = this.checkForPlayabilityErrors();
        if (playabilityError && !this.state.detections.playabilityError.showing) {
            this.reportDetection('playabilityError', { message: playabilityError });
        } else if (!playabilityError && this.state.detections.playabilityError.showing) {
            this.clearDetection('playabilityError');
        }

        // Check for ad blocker detection modals
        const adBlockerDetected = this.checkForAdBlockerModals();
        if (adBlockerDetected && !this.state.detections.adBlocker.showing) {
            this.reportDetection('adBlocker');
        } else if (!adBlockerDetected && this.state.detections.adBlocker.showing) {
            this.clearDetection('adBlocker');
        }

        // Track performance
        this.trackSweepPerformance(sweepStart, adCheckDuration);
    }

    /**
     * Track sweep performance metrics
     * @param {number} sweepStart
     * @param {number} adCheckDuration
     */
    trackSweepPerformance(sweepStart, adCheckDuration) {
        const sweepDuration = performance.now() - sweepStart;
        const perf = this.state.perfMetrics;

        perf.sweepDurations.push(sweepDuration);
        perf.adCheckDurations.push(adCheckDuration);
        perf.sweepCount++;

        // Track top 5 worst
        perf.top5SweepDurations.push(sweepDuration);
        perf.top5SweepDurations.sort((a, b) => b - a);
        if (perf.top5SweepDurations.length > 5) perf.top5SweepDurations.pop();

        perf.top5AdCheckDurations.push(adCheckDuration);
        perf.top5AdCheckDurations.sort((a, b) => b - a);
        if (perf.top5AdCheckDurations.length > 5) perf.top5AdCheckDurations.pop();

        if (sweepDuration > 10) perf.sweepsOver10ms++;
        if (sweepDuration > 50) perf.sweepsOver50ms++;

        // Keep last 50
        if (perf.sweepDurations.length > 50) {
            perf.sweepDurations.shift();
            perf.adCheckDurations.shift();
        }
    }

    // =========================================================================
    // Detection Helpers
    // =========================================================================

    /**
     * Check if a node looks like an ad
     * @param {Node} node
     * @returns {boolean}
     */
    looksLikeAdNode(node) {
        if (!(node instanceof HTMLElement)) return false;

        const classList = node.classList;
        if (classList && this.config.adClasses.some((adClass) => classList.contains(adClass))) {
            return true;
        }

        const txt = (node.innerText || '') + ' ' + (node.getAttribute('aria-label') || '');
        return this.adTextPatterns.some((pattern) => pattern.test(txt));
    }

    /**
     * Check for visible video ads in the player
     * @param {Element} root - Player root element
     * @returns {boolean}
     */
    checkForVideoAds(root) {
        const adSelectors = this.config.adClasses.map((cls) => '.' + cls).join(',');
        const adElements = root.querySelectorAll(adSelectors);
        return Array.from(adElements).some((el) => isVisible(el) && this.looksLikeAdNode(el));
    }

    /**
     * Check for static overlay ads (image ads over the player)
     * @returns {boolean}
     */
    checkForStaticAds() {
        const selectors = this.config.staticAdSelectors;
        const background = document.querySelector(selectors.background);

        if (!background || !isVisible(background)) {
            return false;
        }

        const thumbnail = document.querySelector(selectors.thumbnail);
        const image = document.querySelector(selectors.image);

        if (!thumbnail && !image) {
            return false;
        }

        /** @type {HTMLVideoElement | null} */
        const video = document.querySelector('#movie_player video, .html5-video-player video');
        const videoNotPlaying = !video || (video.paused && video.currentTime < 1);

        if (image) {
            const img = image.querySelector('img');
            if (img && img.src && isVisible(image)) {
                return true;
            }
        }

        if (thumbnail && isVisible(thumbnail) && videoNotPlaying) {
            return true;
        }

        return false;
    }

    /**
     * Check for visible elements matching selectors and text patterns
     * @param {string[]} selectors
     * @param {RegExp[]} patterns
     * @param {Object} [options]
     * @returns {string|null} Matched text or null
     */
    checkVisiblePatternMatch(selectors, patterns, options = {}) {
        const maxLen = options.maxLength || 100;
        const checkAttributedStrings = options.checkAttributedStrings || false;
        const checkDialogFallback = options.checkDialogFallback || false;

        for (const selector of selectors) {
            const el = /** @type {HTMLElement | null} */ (document.querySelector(selector));
            if (el && isVisible(el)) {
                const text = el.innerText || el.textContent || '';
                for (const pattern of patterns) {
                    if (pattern.test(text)) {
                        return text.trim().substring(0, maxLen);
                    }
                }
                if (checkAttributedStrings) {
                    const attributedStrings = el.querySelectorAll('.yt-core-attributed-string[role="text"]');
                    for (const attrEl of attributedStrings) {
                        const attrText = attrEl.textContent || '';
                        for (const pattern of patterns) {
                            if (pattern.test(attrText)) {
                                return attrText.trim().substring(0, maxLen);
                            }
                        }
                    }
                }
            }
        }

        if (checkDialogFallback) {
            const bodyText = document.body?.innerText || '';
            for (const pattern of patterns) {
                if (pattern.test(bodyText)) {
                    const dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"], .ytd-popup-container');
                    for (const dialog of dialogs) {
                        if (dialog instanceof HTMLElement && isVisible(dialog)) {
                            const dialogText = dialog.innerText || '';
                            if (pattern.test(dialogText)) {
                                return dialogText.trim().substring(0, maxLen);
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Check for playability errors (bot detection, content blocking)
     * @returns {string|null}
     */
    checkForPlayabilityErrors() {
        return this.checkVisiblePatternMatch(this.config.playabilityErrorSelectors, this.playabilityErrorPatterns, {
            maxLength: 100,
            checkAttributedStrings: true,
        });
    }

    /**
     * Check for ad blocker detection modals
     * @returns {string|null}
     */
    checkForAdBlockerModals() {
        return this.checkVisiblePatternMatch(this.config.adBlockerDetectionSelectors, this.adBlockerDetectionPatterns, {
            maxLength: 150,
            checkDialogFallback: true,
        });
    }

    // =========================================================================
    // DOM Queries
    // =========================================================================

    /**
     * Find the YouTube player root element
     * @returns {Element|null}
     */
    findPlayerRoot() {
        for (const selector of this.config.playerSelectors) {
            const el = document.querySelector(selector);
            if (el) return el;
        }
        return null;
    }

    /**
     * Get current video ID from URL
     * @returns {string|null}
     */
    getVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }

    // =========================================================================
    // Login State Detection
    // =========================================================================

    /**
     * Detect YouTube user login state using DOM elements
     * @returns {{state: string, isPremium: boolean, rawIndicators: Object}}
     */
    detectLoginState() {
        const selectors = this.config.loginStateSelectors;

        // Return unknown if selectors not configured
        if (!selectors) {
            return { state: 'unknown', isPremium: false, rawIndicators: {} };
        }

        const indicators = {
            hasSignInButton: false,
            hasAvatarButton: false,
            hasPremiumLogo: false,
        };

        try {
            indicators.hasSignInButton = !!document.querySelector(selectors.signInButton);
            indicators.hasAvatarButton = !!document.querySelector(selectors.avatarButton);
            indicators.hasPremiumLogo = !!document.querySelector(selectors.premiumLogo);
        } catch {
            // Silently handle selector errors
        }

        let loginState = 'unknown';
        if (indicators.hasPremiumLogo) {
            loginState = 'premium';
        } else if (indicators.hasAvatarButton) {
            loginState = 'logged-in';
        } else if (indicators.hasSignInButton) {
            loginState = 'logged-out';
        }

        return {
            state: loginState,
            isPremium: indicators.hasPremiumLogo,
            rawIndicators: indicators,
        };
    }

    /**
     * Detect login state with retries for timing issues
     * @param {number} [attempt=1]
     */
    detectAndLogLoginState(attempt = 1) {
        if (this.state.loginState?.state && this.state.loginState.state !== 'unknown') {
            return;
        }

        const loginState = this.detectLoginState();

        if (loginState.state !== 'unknown' || attempt >= 5) {
            this.state.loginState = loginState;
        } else {
            const delay = attempt * 500;
            setTimeout(() => this.detectAndLogLoginState(attempt + 1), delay);
        }
    }

    // =========================================================================
    // Video Tracking
    // =========================================================================

    /**
     * Attach event listeners to video element for tracking
     * @param {Element} root - Player root element
     */
    attachVideoListeners(root) {
        const videoElement = /** @type {HTMLVideoElement | null} */ (root?.querySelector('video'));
        if (!videoElement) {
            setTimeout(() => this.attachVideoListeners(root), 500);
            return;
        }

        if (this.trackedVideoElement === videoElement) return;
        this.trackedVideoElement = videoElement;

        const onLoadStart = () => {
            const vid = this.getVideoId();
            if (vid && vid !== this.lastLoggedVideoId) {
                this.lastLoggedVideoId = vid;
                this.currentVideoId = vid;
                this.videoLoadStartTime = performance.now();
                this.state.videoLoads++;
            }
        };

        const onPlaying = () => {
            if (this.bufferingStartTime) {
                const bufferingDuration = performance.now() - this.bufferingStartTime;
                this.state.buffering.durations.push(Math.round(bufferingDuration));
                this.bufferingStartTime = null;
            }

            if (!this.videoLoadStartTime) return;

            const loadTime = performance.now() - this.videoLoadStartTime;
            const isSlow = loadTime > this.config.slowLoadThresholdMs;
            const duringAd = this.state.detections.videoAd.showing;
            const tabWasHidden = document.hidden;
            const tooLong = loadTime > 30000;

            if (isSlow && !duringAd && !tabWasHidden && !tooLong) {
                this.state.buffering.count++;
                this.state.buffering.durations.push(Math.round(loadTime));
            }
            this.videoLoadStartTime = null;
        };

        const onWaiting = () => {
            if (this.state.detections.videoAd.showing) return;
            if (videoElement.currentTime < 0.5) return;

            const recentlySeekd = this.lastSeekTime && performance.now() - this.lastSeekTime < 3000;
            if (videoElement.seeking || recentlySeekd) return;

            if (!this.bufferingStartTime) {
                this.bufferingStartTime = performance.now();
            }

            this.state.buffering.count++;
        };

        const onSeeking = () => {
            this.lastSeekTime = performance.now();
        };

        videoElement.addEventListener('loadstart', onLoadStart);
        videoElement.addEventListener('playing', onPlaying);
        videoElement.addEventListener('waiting', onWaiting);
        videoElement.addEventListener('seeking', onSeeking);

        // Track video ID for fresh navigation
        const vid = this.getVideoId();
        if (vid && vid !== this.lastLoggedVideoId) {
            this.lastLoggedVideoId = vid;
            this.currentVideoId = vid;
            this.state.videoLoads++;
        }
    }

    // =========================================================================
    // SPA Navigation
    // =========================================================================

    /**
     * Check for URL changes (SPA navigation)
     */
    checkUrlChange() {
        const currentUrl = location.href;
        if (currentUrl !== this.lastUrl) {
            this.lastUrl = currentUrl;
        }
    }

    /**
     * Set up history API interception for SPA navigation
     */
    setupNavigationTracking() {
        this.originalPushState = history.pushState;
        this.originalReplaceState = history.replaceState;

        const origPush = this.originalPushState;
        const origReplace = this.originalReplaceState;

        history.pushState = (...args) => {
            origPush.apply(history, args);
            this.checkUrlChange();
        };

        history.replaceState = (...args) => {
            origReplace.apply(history, args);
            this.checkUrlChange();
        };

        window.addEventListener('popstate', () => this.checkUrlChange());
    }

    // =========================================================================
    // Lifecycle
    // =========================================================================

    /**
     * Start the detector
     */
    start() {
        const root = this.findPlayerRoot();
        if (!root) {
            setTimeout(() => this.start(), 500);
            return;
        }

        this.playerRoot = root;

        // Initial login state detection
        this.detectAndLogLoginState();

        // Start video tracking
        this.attachVideoListeners(root);

        // Start sweep loop
        this.sweep();
        this.pollInterval = setInterval(() => this.sweep(), this.config.sweepIntervalMs);

        // Check for player root changes
        this.rerootInterval = setInterval(() => {
            const r = this.findPlayerRoot();
            if (r && r !== this.playerRoot) {
                this.playerRoot = r;
                if (this.pollInterval) clearInterval(this.pollInterval);
                this.pollInterval = setInterval(() => this.sweep(), this.config.sweepIntervalMs);
            }
        }, 1000);

        // Set up SPA navigation tracking
        this.setupNavigationTracking();
    }

    /**
     * Stop the detector
     */
    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.rerootInterval) {
            clearInterval(this.rerootInterval);
            this.rerootInterval = null;
        }

        // Restore history methods
        if (this.originalPushState) {
            history.pushState = this.originalPushState;
        }
        if (this.originalReplaceState) {
            history.replaceState = this.originalReplaceState;
        }
    }

    // =========================================================================
    // Results
    // =========================================================================

    /**
     * Get detection results in standard format
     * @returns {Object}
     */
    getResults() {
        const d = this.state.detections;

        // Calculate buffering stats
        const totalBufferingMs = this.state.buffering.durations.reduce((sum, dur) => sum + dur, 0);
        const avgBufferingMs = this.state.buffering.durations.length > 0 ? totalBufferingMs / this.state.buffering.durations.length : 0;
        const bufferAvgSec = Math.round(avgBufferingMs / 1000);

        // Refresh login state if unknown
        let loginState = this.state.loginState;
        if (!loginState || loginState.state === 'unknown') {
            const freshCheck = this.detectLoginState();
            if (freshCheck.state !== 'unknown') {
                this.state.loginState = freshCheck;
                loginState = freshCheck;
            }
        }

        // Calculate average sweep time (rounded to nearest ms for privacy)
        const perf = this.state.perfMetrics;
        let sweepAvgMs = null;
        if (perf && perf.sweepCount > 0 && perf.sweepDurations.length > 0) {
            const avg = perf.sweepDurations.reduce((a, b) => a + b, 0) / perf.sweepDurations.length;
            sweepAvgMs = Math.round(avg);
        }

        return {
            detected:
                d.videoAd.count > 0 ||
                d.staticAd.count > 0 ||
                d.playabilityError.count > 0 ||
                d.adBlocker.count > 0 ||
                this.state.buffering.count > 0,
            type: 'youtubeAds',
            results: [
                {
                    adsDetected: d.videoAd.count,
                    staticAdsDetected: d.staticAd.count,
                    playabilityErrorsDetected: d.playabilityError.count,
                    adBlockerDetectionCount: d.adBlocker.count,
                    bufferingCount: this.state.buffering.count,
                    bufferAvgSec,
                    userState: loginState?.state || 'unknown',
                    sweepAvgMs,
                },
            ],
        };
    }
}

// =========================================================================
// Module-level singleton
// =========================================================================

/** @type {YouTubeAdDetector | null} */
let detectorInstance = null;

/**
 * Run YouTube ad detection
 * @param {YouTubeDetectorConfig} [config] - Configuration from privacy-config
 * @returns {Object} Detection results in standard format
 */
export function runYoutubeAdDetection(config) {
    // Don't initialize if no config or explicitly disabled
    if (!config || config.state === 'disabled') {
        return { detected: false, type: 'youtubeAds', results: [] };
    }

    // Auto-initialize on first call if on YouTube
    const hostname = window.location.hostname;
    if (!detectorInstance && (hostname === 'youtube.com' || hostname.endsWith('.youtube.com'))) {
        detectorInstance = new YouTubeAdDetector(config);
        detectorInstance.start();
    }

    // Return empty result if not initialized
    if (!detectorInstance) {
        return {
            detected: false,
            type: 'youtubeAds',
            results: [],
        };
    }

    return detectorInstance.getResults();
}
