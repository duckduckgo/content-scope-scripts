/**
 * Module-level state for YouTube ad detection
 * Persists across multiple calls to runYoutubeAdDetection
 */
let state = null;
let pollInterval = null;
let rerootInterval = null;

/** @type {{signInButton: string, avatarButton: string, premiumLogo: string}|null} */
let storedLoginSelectors = null;

/**
 * Detect YouTube user login state using DOM elements
 * Uses selectors stored during initDetector from privacy-config
 * @returns {{state: string, isPremium: boolean, rawIndicators: Object}}
 */
const detectLoginState = () => {
    // Use stored selectors from config (set during initDetector)
    if (!storedLoginSelectors) {
        return { state: 'unknown', isPremium: false, rawIndicators: {} };
    }

    const sels = storedLoginSelectors;

    /** @type {{hasSignInButton: boolean, hasAvatarButton: boolean, hasPremiumLogo: boolean}} */
    const indicators = {
        hasSignInButton: false,
        hasAvatarButton: false,
        hasPremiumLogo: false
    };

    try {
        // Check for sign-in button (indicates logged out)
        indicators.hasSignInButton = !!document.querySelector(sels.signInButton);

        // Check for avatar button (indicates logged in)
        indicators.hasAvatarButton = !!document.querySelector(sels.avatarButton);

        // Check for Premium logo (indicates premium subscriber)
        indicators.hasPremiumLogo = !!document.querySelector(sels.premiumLogo);
    } catch (e) {
        // Silently handle errors in login detection
    }

    // Determine overall state
    // Priority: 1) Premium logo, 2) Avatar (logged in), 3) Sign-in button (logged out)
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
        rawIndicators: indicators
    };
};

/**
 * @typedef {Object} YouTubeDetectorConfig
 * @property {string} [state] - Feature state: 'enabled', 'disabled', or 'internal'
 * @property {string[]} playerSelectors - Selectors for the player root element
 * @property {string[]} adClasses - CSS classes that indicate ads
 * @property {string[]} adTextPatterns - Text patterns (regex) that indicate ads
 * @property {number} sweepIntervalMs - How often to check for ads/buffering (ms)
 * @property {number} slowLoadThresholdMs - Threshold for counting slow loads as buffering (ms)
 * @property {{background: string, thumbnail: string, image: string}} staticAdSelectors - Selectors for static overlay ads
 * @property {string[]} playabilityErrorSelectors - Selectors for playability error containers
 * @property {string[]} playabilityErrorPatterns - Text patterns (regex) for playability errors
 * @property {string[]} adBlockerDetectionSelectors - Selectors for ad blocker detection modals
 * @property {string[]} adBlockerDetectionPatterns - Text patterns (regex) for ad blocker detection
 * @property {{signInButton: string, avatarButton: string, premiumLogo: string}} loginStateSelectors - Selectors for login state detection
 */

/**
 * Initialize the YouTube ad detector
 * @param {YouTubeDetectorConfig} config - Configuration from privacy-config
 */
function initDetector(config) {

    // All configuration comes from privacy-config (required)
    const PLAYER_SELS = config.playerSelectors;
    const AD_CLASS_EXACT = config.adClasses;
    const SWEEP_INTERVAL = config.sweepIntervalMs;
    const SLOW_LOAD_THRESHOLD_MS = config.slowLoadThresholdMs;

    /**
     * Convert string patterns to RegExp objects
     * @param {string[]} patterns - Array of regex pattern strings
     * @param {string} [flags='i'] - RegExp flags (default: case-insensitive)
     * @returns {RegExp[]}
     */
    const toRegExpArray = (patterns, flags = 'i') => {
        return patterns.map(p => new RegExp(p, flags));
    };

    // Text patterns that indicate ads (from config, converted to RegExp at runtime)
    const AD_TEXT_PATTERNS = toRegExpArray(config.adTextPatterns);

    // Selectors for static overlay ads (from config)
    const STATIC_AD_SELECTORS = config.staticAdSelectors;

    // Selectors for playability errors (from config)
    const PLAYABILITY_ERROR_SELECTORS = config.playabilityErrorSelectors;

    // Error messages that indicate bot detection or content blocking (from config)
    const PLAYABILITY_ERROR_PATTERNS = toRegExpArray(config.playabilityErrorPatterns);

    // Selectors for ad blocker detection modals/dialogs (from config)
    const ADBLOCKER_DETECTION_SELECTORS = config.adBlockerDetectionSelectors;

    // Text patterns that indicate ad blocker detection (from config)
    const ADBLOCKER_DETECTION_PATTERNS = toRegExpArray(config.adBlockerDetectionPatterns);

    // Login state selectors (from config)
    const LOGIN_STATE_SELECTORS = config.loginStateSelectors;

    // Store login selectors for use in detectLoginState
    storedLoginSelectors = LOGIN_STATE_SELECTORS;

    // Initialize state with category-based structure
    state = {
        detections: {
            videoAd: { count: 0, showing: false },
            staticAd: { count: 0, showing: false },
            playabilityError: { count: 0, showing: false, lastMessage: null },
            adBlocker: { count: 0, showing: false }
        },
        buffering: {
            count: 0,
            durations: [] // Array of buffering durations in ms
        },
        videoLoads: 0,
        /** @type {{state: string, isPremium: boolean, rawIndicators: Object}|null} */
        loginState: null
    };

    // Detect initial login state (with retry for timing issues)
    const detectInitialLoginState = (attempt = 1) => {
        // Skip if we already have a valid (non-unknown) login state
        if (state.loginState?.state && state.loginState.state !== 'unknown') {
            return;
        }

        const loginState = detectLoginState();

        // Only update state if we got a valid result OR this is our last attempt
        if (loginState.state !== 'unknown' || attempt >= 5) {
            state.loginState = loginState;
        } else {
            // YouTube globals not ready yet, retry after delay
            const delay = attempt * 500;
            setTimeout(() => detectInitialLoginState(attempt + 1), delay);
        }
    };

    detectInitialLoginState();

    let trackedVideoElement = null;
    let lastLoggedVideoId = null;
    let currentVideoId = null;
    let videoLoadStartTime = null;
    let bufferingStartTime = null;
    let lastSeekTime = null;

    /**
     * Get the player root element
     */
    const getRoot = () => {
        for (const s of PLAYER_SELS) {
            const n = document.querySelector(s);
            if (n) return n;
        }
        return null;
    };

    /**
     * Check if element is visible
     */
    const visible = (el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return r.width > 0.5 && r.height > 0.5 && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05;
    };

    /**
     * Check for visible elements matching selectors and text patterns
     * @param {string[]} selectors - CSS selectors to check
     * @param {RegExp[]} patterns - Text patterns to match
     * @param {Object} [options] - Options
     * @param {number} [options.maxLength=100] - Max length of returned text
     * @param {boolean} [options.checkAttributedStrings=false] - Also check yt-core-attributed-string inside
     * @param {boolean} [options.checkDialogFallback=false] - Fallback to checking dialogs if body matches
     * @returns {string|null} Matched text or null
     */
    const checkVisiblePatternMatch = (selectors, patterns, options = {}) => {
        const maxLen = options.maxLength || 100;
        const checkAttributedStrings = options.checkAttributedStrings || false;
        const checkDialogFallback = options.checkDialogFallback || false;

        // Check known container selectors
        for (const selector of selectors) {
            const el = /** @type {HTMLElement | null} */ (document.querySelector(selector));
            if (el && visible(el)) {
                const text = el.innerText || el.textContent || '';
                for (const pattern of patterns) {
                    if (pattern.test(text)) {
                        return text.trim().substring(0, maxLen);
                    }
                }
                // Optionally check yt-core-attributed-string inside
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

        // Fallback: check if pattern matches body, then verify in dialog context
        if (checkDialogFallback) {
            const bodyText = document.body?.innerText || '';
            for (const pattern of patterns) {
                if (pattern.test(bodyText)) {
                    const dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"], .ytd-popup-container');
                    for (const dialog of dialogs) {
                        if (dialog instanceof HTMLElement && visible(dialog)) {
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
    };

    /**
     * Report a detection event
     * @param {'videoAd'|'staticAd'|'playabilityError'|'adBlocker'} type - Detection type
     * @param {Object} [details] - Additional details
     * @param {string} [details.message] - Error message (for playabilityError)
     * @returns {boolean} Whether the detection was new (not already showing)
     */
    const reportDetection = (type, details = {}) => {
        const typeState = state.detections[type];

        // Check if already showing (with same message for types that track it)
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
    };

    /**
     * Clear a detection state
     * @param {'videoAd'|'staticAd'|'playabilityError'|'adBlocker'} type - Detection type
     */
    const clearDetection = (type) => {
        const typeState = state.detections[type];
        if (!typeState.showing) return;

        typeState.showing = false;
        if ('lastMessage' in typeState) {
            typeState.lastMessage = null;
        }
    };

    /**
     * Check if node looks like an ad
     */
    const looksLikeAdNode = (node) => {
        if (!(node instanceof HTMLElement)) return false;

        // Check for exact class matches
        const classList = node.classList;
        if (classList && AD_CLASS_EXACT.some(adClass => classList.contains(adClass))) {
            return true;
        }

        // Check text content with precise patterns
        const txt = ((node.innerText || '') + ' ' + (node.getAttribute('aria-label') || ''));
        return AD_TEXT_PATTERNS.some(pattern => pattern.test(txt));
    };

    /**
     * Check for static overlay ads (image ads that appear over the player)
     */
    const checkStaticOverlayAd = () => {
        const background = document.querySelector(STATIC_AD_SELECTORS.background);
        if (!background) {
            return false;
        }

        const backgroundVisible = visible(background);
        if (!backgroundVisible) {
            return false;
        }

        const thumbnail = document.querySelector(STATIC_AD_SELECTORS.thumbnail);
        const image = document.querySelector(STATIC_AD_SELECTORS.image);

        if (!thumbnail && !image) {
            return false;
        }

        /** @type {HTMLVideoElement | null} */
        const video = document.querySelector('#movie_player video, .html5-video-player video');
        const videoNotPlaying = !video || (video.paused && video.currentTime < 1);

        if (image) {
            const img = image.querySelector('img');
            if (img && img.src && visible(image)) {
                return true;
            }
        }

        if (thumbnail && visible(thumbnail) && videoNotPlaying) {
            return true;
        }

        return false;
    };

    /**
     * Check for playability errors (bot detection, content blocking)
     */
    const checkPlayabilityError = () => {
        return checkVisiblePatternMatch(
            PLAYABILITY_ERROR_SELECTORS,
            PLAYABILITY_ERROR_PATTERNS,
            { maxLength: 100, checkAttributedStrings: true }
        );
    };

    /**
     * Check for ad blocker detection modals/dialogs
     */
    const checkAdBlockerDetection = () => {
        return checkVisiblePatternMatch(
            ADBLOCKER_DETECTION_SELECTORS,
            ADBLOCKER_DETECTION_PATTERNS,
            { maxLength: 150, checkDialogFallback: true }
        );
    };

    /**
     * Get current video ID from URL
     */
    const getVideoId = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    };

    /**
     * Track video element events
     */
    const trackVideoLoad = (root) => {
        const videoElement = root?.querySelector('video');
        if (!videoElement) {
            setTimeout(() => trackVideoLoad(root), 500);
            return;
        }

        if (trackedVideoElement === videoElement) return;
        trackedVideoElement = videoElement;

        const onLoadStart = () => {
            const vid = getVideoId();
            if (vid && vid !== lastLoggedVideoId) {
                lastLoggedVideoId = vid;
                currentVideoId = vid;
                videoLoadStartTime = performance.now();
                state.videoLoads++;
            }
        };

        const MAX_REASONABLE_LOAD_MS = 30000;

        const onPlaying = () => {
            if (bufferingStartTime) {
                const bufferingDuration = performance.now() - bufferingStartTime;
                state.buffering.durations.push(Math.round(bufferingDuration));
                bufferingStartTime = null;
            }

            if (!videoLoadStartTime) {
                return;
            }

            const loadTime = performance.now() - videoLoadStartTime;
            const isSlow = loadTime > SLOW_LOAD_THRESHOLD_MS;
            const duringAd = state.detections.videoAd.showing;
            const tabWasHidden = document.hidden;
            const tooLong = loadTime > MAX_REASONABLE_LOAD_MS;

            if (isSlow && !duringAd && !tabWasHidden && !tooLong) {
                state.buffering.count++;
                state.buffering.durations.push(Math.round(loadTime));
            }
            videoLoadStartTime = null;
        };

        const onWaiting = () => {
            if (state.detections.videoAd.showing) {
                return;
            }

            if (videoElement.currentTime < 0.5) {
                return;
            }

            const recentlySeekd = lastSeekTime && (performance.now() - lastSeekTime < 3000);
            if (videoElement.seeking || recentlySeekd) {
                return;
            }

            if (!bufferingStartTime) {
                bufferingStartTime = performance.now();
            }

            state.buffering.count++;
        };

        const onSeeking = () => {
            lastSeekTime = performance.now();
        };

        videoElement.addEventListener('loadstart', onLoadStart);
        videoElement.addEventListener('playing', onPlaying);
        videoElement.addEventListener('waiting', onWaiting);
        videoElement.addEventListener('seeking', onSeeking);

        const vid = getVideoId();
        if (vid && vid !== lastLoggedVideoId) {
            lastLoggedVideoId = vid;
            currentVideoId = vid;
            state.videoLoads++;
        }
    };

    /**
     * Start detection on player root
     */
    const start = () => {
        const root = getRoot();
        if (!root) {
            setTimeout(start, 500);
            return;
        }

        trackVideoLoad(root);

        const sweep = () => {
            const currentRoot = getRoot();
            if (!currentRoot) return;

            trackVideoLoad(currentRoot);

            // Check if ad is currently visible
            const adSelectors = AD_CLASS_EXACT.map(cls => '.' + cls).join(',');
            const adElements = currentRoot.querySelectorAll(adSelectors);
            const hasVisibleAd = Array.from(adElements).some(el => visible(el) && looksLikeAdNode(el));

            if (hasVisibleAd && !state.detections.videoAd.showing) {
                reportDetection('videoAd');
            } else if (!hasVisibleAd && state.detections.videoAd.showing) {
                clearDetection('videoAd');
            }

            // Check for static overlay ads
            const hasStaticAd = checkStaticOverlayAd();
            if (hasStaticAd && !state.detections.staticAd.showing) {
                reportDetection('staticAd');
            } else if (!hasStaticAd && state.detections.staticAd.showing) {
                clearDetection('staticAd');
            }

            // Check for playability errors
            const playabilityError = checkPlayabilityError();
            if (playabilityError && !state.detections.playabilityError.showing) {
                reportDetection('playabilityError', { message: playabilityError });
            } else if (!playabilityError && state.detections.playabilityError.showing) {
                clearDetection('playabilityError');
            }

            // Check for ad blocker detection modals
            const adBlockerDetected = checkAdBlockerDetection();
            if (adBlockerDetected && !state.detections.adBlocker.showing) {
                reportDetection('adBlocker');
            } else if (!adBlockerDetected && state.detections.adBlocker.showing) {
                clearDetection('adBlocker');
            }
        };

        sweep();
        pollInterval = setInterval(sweep, SWEEP_INTERVAL);

        // Check for player root changes
        rerootInterval = setInterval(() => {
            const r = getRoot();
            if (r && r !== root) {
                if (pollInterval) clearInterval(pollInterval);
                if (rerootInterval) clearInterval(rerootInterval);
                start();
            }
        }, 1000);
    };

    start();

    // Listen for YouTube SPA navigation
    let lastUrl = location.href;

    const checkUrlChange = () => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
        }
    };

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
        originalPushState.apply(this, args);
        checkUrlChange();
    };

    history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        checkUrlChange();
    };

    window.addEventListener('popstate', checkUrlChange);
}

/**
 * Run YouTube ad detection
 * @param {Object} config - Configuration from privacy-config
 * @returns {Object} Detection results in standard format
 */
export function runYoutubeAdDetection(config = {}) {
    // Safety guardrail - never run outside YouTube
    if (!window.location.hostname.includes('youtube.com')) {
        return {
            detected: false,
            type: 'youtubeAds',
            results: []
        };
    }

    // Config controls whether detection is enabled
    if (config.state && config.state !== 'enabled') {
        return {
            detected: false,
            type: 'youtubeAds',
            results: []
        };
    }

    // Auto-initialize on first call
    if (!state) {
        initDetector(config);
    }

    // Return empty result if initialization failed
    if (!state) {
        return {
            detected: false,
            type: 'youtubeAds',
            results: []
        };
    }

    // Calculate average buffering time, rounded to nearest second for privacy
    const totalBufferingMs = state.buffering.durations.reduce((sum, dur) => sum + dur, 0);
    const avgBufferingMs = state.buffering.durations.length > 0
        ? totalBufferingMs / state.buffering.durations.length
        : 0;
    const bufferAvgSec = Math.round(avgBufferingMs / 1000);

    const d = state.detections;

    // If stored login state is unknown, try a fresh check
    let loginState = state.loginState;
    if (!loginState || loginState.state === 'unknown') {
        const freshCheck = detectLoginState();
        if (freshCheck.state !== 'unknown') {
            state.loginState = freshCheck;
            loginState = freshCheck;
        }
    }

    return {
        detected: d.videoAd.count > 0 || d.staticAd.count > 0 || d.playabilityError.count > 0 || d.adBlocker.count > 0 || state.buffering.count > 0,
        type: 'youtubeAds',
        results: [{
            adsDetected: d.videoAd.count,
            staticAdsDetected: d.staticAd.count,
            playabilityErrorsDetected: d.playabilityError.count,
            adBlockerDetectionCount: d.adBlocker.count,
            bufferingCount: state.buffering.count,
            bufferAvgSec: bufferAvgSec,
            userState: loginState?.state || 'unknown'
        }]
    };
}
