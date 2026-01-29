/**
 * Module-level state for YouTube ad detection
 * Persists across multiple calls to runYoutubeAdDetection
 */
let state = null;
let pollInterval = null;
let rerootInterval = null;

/**
 * Logging utility for YouTube ad detection
 * All logs prefixed with [YT-AdDetect] for easy filtering
 */
/**
 * Detect which world we're running in
 * Isolated world has chrome.runtime, page context does not
 */
const detectWorld = () => {
    try {
        // chrome.runtime.id exists in content scripts (isolated world) but not page context
        // @ts-ignore
        if (window.chrome?.runtime?.id) {
            return 'isolated';
        }
        // If no chrome.runtime, we're in page context (content-scope-scripts is injected there)
        return 'page';
    } catch {
        return 'page'; // Assume page context if detection fails
    }
};

const WORLD = detectWorld();
const LOG_PREFIX = `[YT-AdDetect:${WORLD}]`;
const log = {
    info: (...args) => console.log(LOG_PREFIX, ...args),
    warn: (...args) => console.warn(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
    debug: (...args) => console.debug(LOG_PREFIX, ...args)
};

/**
 * Detect YouTube user login state using DOM elements
 * Works in sandboxed contexts that can't access page JS globals
 * @returns {{state: string, isPremium: boolean, rawIndicators: Object}}
 */
const detectLoginState = () => {
    /** @type {{hasSignInButton: boolean, hasAvatarButton: boolean, hasPremiumLogo: boolean}} */
    const indicators = {
        hasSignInButton: false,
        hasAvatarButton: false,
        hasPremiumLogo: false
    };

    try {
        // Check for sign-in button (indicates logged out)
        indicators.hasSignInButton = !!document.querySelector('a[href*="accounts.google.com/ServiceLogin"]');

        // Check for avatar button (indicates logged in)
        indicators.hasAvatarButton = !!document.querySelector('#avatar-btn');

        // Check for Premium logo (indicates premium subscriber)
        indicators.hasPremiumLogo = !!document.querySelector('ytd-topbar-logo-renderer a[title*="Premium"]');
    } catch (e) {
        log.warn('Error detecting login state:', e);
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
 * Initialize the YouTube ad detector
 * @param {Object} config - Configuration from privacy-config
 * @param {string[]} [config.playerSelectors] - Selectors for the player root element
 * @param {string[]} [config.adClasses] - CSS classes that indicate ads
 * @param {number} [config.sweepIntervalMs=2000] - How often to check for ads/buffering (ms)
 * @param {number} [config.slowLoadThresholdMs=2000] - Threshold for counting slow loads as buffering (ms)
 * @param {boolean} [config.debugLogging=false] - Enable verbose debug logging
 */
function initDetector(config) {

    // Selector configuration
    const PLAYER_SELS = config.playerSelectors || ['#movie_player', '.html5-video-player', '#player'];
    const AD_CLASS_EXACT = config.adClasses || [
        'ytp-ad-text',
        'ytp-ad-skip-button',
        'ytp-ad-skip-button-container',
        'ytp-ad-message-container',
        'ytp-ad-player-overlay',
        'ytp-ad-image-overlay',
        'video-ads',
        'ad-showing',
        'ad-interrupting'
    ];
    const SWEEP_INTERVAL = config.sweepIntervalMs || 2000;
    const SLOW_LOAD_THRESHOLD_MS = config.slowLoadThresholdMs || 2000;
    const DEBUG_LOGGING = config.debugLogging || false;

    /**
     * Convert string patterns to RegExp objects
     * @param {string[]} patterns - Array of regex pattern strings
     * @param {string} [flags='i'] - RegExp flags (default: case-insensitive)
     * @returns {RegExp[]}
     */
    const toRegExpArray = (patterns, flags = 'i') => {
        return patterns.map(p => new RegExp(p, flags));
    };

    // Text patterns that indicate ads (strings, converted to RegExp at runtime)
    const AD_TEXT_PATTERNS = toRegExpArray([
        '\\badvertisement\\b',
        '\\bskip ad\\b',
        '\\bskip ads\\b',
        '^ad\\s*[•:·]'
    ]);

    // Selectors for static overlay ads (image ads that appear over the player)
    const STATIC_AD_SELECTORS = {
        background: '.player-container-background',
        thumbnail: '.player-container-background-image, .player-container-background ytd-thumbnail',
        image: '.player-container-background yt-image'
    };

    // Selectors for playability errors (bot detection, content blocking)
    const PLAYABILITY_ERROR_SELECTORS = [
        'ytm-player-error-message-renderer',
        'yt-player-error-message-renderer',
        '.ytp-error',
        '.playability-status-message',
        '.playability-reason'
    ];

    // Error messages that indicate bot detection or content blocking (strings, converted to RegExp)
    const PLAYABILITY_ERROR_PATTERNS = toRegExpArray([
        "content isn't available",
        'video (is )?unavailable',
        'playback (is )?disabled',
        "confirm you're not a (ro)?bot",
        'sign in to confirm',
        'unusual traffic',
        'try again later'
    ]);

    // Selectors for ad blocker detection modals/dialogs
    const ADBLOCKER_DETECTION_SELECTORS = [
        'ytd-enforcement-message-view-model',
        'ytd-popup-container tp-yt-paper-dialog',
        'tp-yt-paper-dialog',
        '.ytd-enforcement-message-view-model',
        '#dialog',
        '[role="dialog"]'
    ];

    // Text patterns that indicate ad blocker detection (strings, converted to RegExp)
    const ADBLOCKER_DETECTION_PATTERNS = toRegExpArray([
        'ad\\s*blockers?\\s*(are)?\\s*not allowed',
        'using an ad\\s*blocker',
        'allow youtube ads',
        'disable.*ad\\s*blocker',
        'turn off.*ad\\s*blocker',
        'ad\\s*blocker.*detected',
        'ad\\s*blocking',
        'will be blocked after \\d+ videos?',
        'playback will be blocked',
        'playback is blocked',
        'youtube is allowlisted',
        'video player will be blocked',
        'ad\\s*blockers?\\s*violate',
        'violate.*terms of service'
    ]);

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
        loginState: null, // Will be populated on init and periodically
        /** @type {{sweepDurations: number[], adCheckDurations: number[], sweepCount: number, top5SweepDurations: number[], top5AdCheckDurations: number[], sweepsOver10ms: number, sweepsOver50ms: number}|null} */
        perfMetrics: null // Will be set after perfMetrics object is created
    };

    // Detect and log initial login state (with retry for timing issues)
    // Only run if we don't already have a valid login state (prevents race conditions on SPA nav)
    const detectAndLogLoginState = (attempt = 1) => {
        // Skip if we already have a valid (non-unknown) login state
        if (state.loginState?.state && state.loginState.state !== 'unknown') {
            log.debug('Login state already detected, skipping retry', state.loginState.state);
            return;
        }

        const loginState = detectLoginState();

        // Only update state if we got a valid result OR this is our last attempt
        if (loginState.state !== 'unknown' || attempt >= 5) {
            state.loginState = loginState;
            log.info('Login state detected:', loginState.state, loginState.isPremium ? '(Premium)' : '', {
                attempt,
                indicators: loginState.rawIndicators
            });
        } else {
            // YouTube globals not ready yet, retry after delay
            const delay = attempt * 500; // 500ms, 1000ms, 1500ms, 2000ms
            log.debug(`Login state unknown, retrying in ${delay}ms (attempt ${attempt}/5)`);
            setTimeout(() => detectAndLogLoginState(attempt + 1), delay);
        }
    };

    detectAndLogLoginState();

    let trackedVideoElement = null;
    let lastLoggedVideoId = null;
    let currentVideoId = null;
    let videoLoadStartTime = null;
    let bufferingStartTime = null;
    let lastSweepTime = null;
    let lastSeekTime = null; // Track when user last seeked to ignore post-seek buffering

    // Performance tracking (minimal overhead, stats computed on-demand)
    // Exposed at module level so runYoutubeAdDetection can access it
    const perfMetrics = {
        sweepDurations: /** @type {number[]} */ ([]), // Last 50 sweep times
        adCheckDurations: /** @type {number[]} */ ([]),
        sweepCount: 0,
        // All-time worst-case tracking (never cleared)
        top5SweepDurations: /** @type {number[]} */ ([]),
        top5AdCheckDurations: /** @type {number[]} */ ([]),
        sweepsOver10ms: 0,  // Count of slow sweeps
        sweepsOver50ms: 0   // Count of very slow sweeps
    };

    // Store perfMetrics on state so runYoutubeAdDetection can access it
    state.perfMetrics = perfMetrics;

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
     * @param {string} logMessage - Message to log
     * @param {Object} [details] - Additional details
     * @param {string} [details.message] - Error message (for playabilityError)
     * @returns {boolean} Whether the detection was new (not already showing)
     */
    const reportDetection = (type, logMessage, details = {}) => {
        const typeState = state.detections[type];

        // Check if already showing (with same message for types that track it)
        if (typeState.showing) {
            if (!details.message || typeState.lastMessage === details.message) {
                return false; // Already detected
            }
        }

        typeState.showing = true;
        typeState.count++;
        if (details.message && 'lastMessage' in typeState) {
            typeState.lastMessage = details.message;
        }

        log.info(logMessage, {
            total: typeState.count,
            videoId: currentVideoId,
            url: window.location.href,
            ...details
        });

        return true;
    };

    /**
     * Clear a detection state
     * @param {'videoAd'|'staticAd'|'playabilityError'|'adBlocker'} type - Detection type
     * @param {string} logMessage - Message to log
     */
    const clearDetection = (type, logMessage) => {
        const typeState = state.detections[type];
        if (!typeState.showing) return;

        typeState.showing = false;
        if ('lastMessage' in typeState) {
            typeState.lastMessage = null;
        }

        log.info(logMessage, {
            total: typeState.count,
            videoId: currentVideoId
        });
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
     * These are different from video ads - they show static images over the player
     * while the video doesn't autoplay
     */
    const checkStaticOverlayAd = () => {
        const background = document.querySelector(STATIC_AD_SELECTORS.background);
        if (!background) {
            return false;
        }

        // Check if the background container is visible
        const backgroundVisible = visible(background);
        if (!backgroundVisible) {
            return false;
        }

        // Check for thumbnail/image inside the background
        const thumbnail = document.querySelector(STATIC_AD_SELECTORS.thumbnail);
        const image = document.querySelector(STATIC_AD_SELECTORS.image);

        if (!thumbnail && !image) {
            if (DEBUG_LOGGING) {
                log.debug('Static ad check: background visible but no thumbnail/image found');
            }
            return false;
        }

        /** @type {HTMLVideoElement | null} */
        const video = document.querySelector('#movie_player video, .html5-video-player video');

        // Helper: check if video is in a "not playing" state (paused at/near start, or not loaded)
        const videoNotPlaying = !video || (video.paused && video.currentTime < 1);

        // Check if the image element has actual content (src or loaded image)
        if (image) {
            const img = image.querySelector('img');
            if (img && img.src && visible(image)) {
                if (DEBUG_LOGGING) {
                    log.debug('Static ad detected via yt-image', { src: img.src });
                }
                return true;
            }
        }

        // Check thumbnail element visibility - if visible with video not playing, it's a static ad
        if (thumbnail && visible(thumbnail)) {
            // Thumbnail visible + video not playing = static ad overlay
            if (videoNotPlaying) {
                if (DEBUG_LOGGING) {
                    const thumbRect = thumbnail.getBoundingClientRect();
                    log.debug('Static ad detected: thumbnail visible, video not playing', {
                        thumbSize: `${Math.round(thumbRect.width)}x${Math.round(thumbRect.height)}`,
                        videoState: video ? { paused: video.paused, currentTime: video.currentTime } : 'no video element'
                    });
                }
                return true;
            }
        }

        return false;
    };

    /**
     * Check for playability errors (bot detection, content blocking)
     * Returns the error message if found, null otherwise
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
     * These are YouTube's "Ad blockers are not allowed" messages
     * Uses broad text matching since we can't reproduce reliably
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

        // Only set up listeners if this is a new video element
        if (trackedVideoElement === videoElement) return;
        trackedVideoElement = videoElement;

        // Track when video starts loading
        const onLoadStart = () => {
            const vid = getVideoId();
            if (vid && vid !== lastLoggedVideoId) {
                lastLoggedVideoId = vid;
                currentVideoId = vid;
                videoLoadStartTime = performance.now();
                state.videoLoads++;
                if (DEBUG_LOGGING) {
                    log.debug('Video load started', {
                        videoId: vid,
                        totalVideoLoads: state.videoLoads,
                        readyState: videoElement.readyState,
                        tabHidden: document.hidden
                    });
                }
            }
        };

        // Track when video actually starts playing - count slow loads as buffering
        const MAX_REASONABLE_LOAD_MS = 30000; // 30 seconds - beyond this is user behavior, not buffering

        const onPlaying = () => {
            // Track end of buffering period (only if we were tracking mid-playback buffering)
            if (bufferingStartTime) {
                const bufferingDuration = performance.now() - bufferingStartTime;
                state.buffering.durations.push(Math.round(bufferingDuration));
                if (DEBUG_LOGGING) {
                    log.debug('Buffering ended', {
                        videoId: currentVideoId,
                        durationMs: Math.round(bufferingDuration)
                    });
                }
                bufferingStartTime = null;
            }

            // Only count slow initial load if we have a valid loadstart timestamp
            // This prevents counting manual play clicks as buffering
            if (!videoLoadStartTime) {
                if (DEBUG_LOGGING) {
                    log.debug('Playing event without loadstart (user interaction, not counted)', {
                        videoId: currentVideoId
                    });
                }
                return;
            }

            const loadTime = performance.now() - videoLoadStartTime;
            const isSlow = loadTime > SLOW_LOAD_THRESHOLD_MS;
            const duringAd = state.detections.videoAd.showing;
            const tabWasHidden = document.hidden;
            const tooLong = loadTime > MAX_REASONABLE_LOAD_MS;

            if (DEBUG_LOGGING) {
                log.debug('Video playing event', {
                    videoId: currentVideoId,
                    loadTimeMs: Math.round(loadTime),
                    threshold: SLOW_LOAD_THRESHOLD_MS,
                    willCountAsBuffering: isSlow && !duringAd && !tabWasHidden && !tooLong,
                    readyState: videoElement.readyState,
                    paused: videoElement.paused,
                    seeking: videoElement.seeking,
                    tabHidden: tabWasHidden,
                    adCurrentlyShowing: duringAd
                });
            }

            // Count as buffering if: slow, not during ad, tab was visible, reasonable duration
            if (isSlow && !duringAd && !tabWasHidden && !tooLong) {
                state.buffering.count++;
                state.buffering.durations.push(Math.round(loadTime));
                log.info('Slow video load (buffering)', {
                    videoId: currentVideoId,
                    loadTimeMs: Math.round(loadTime),
                    totalBufferingCount: state.buffering.count,
                    readyState: videoElement.readyState
                });
            }
            videoLoadStartTime = null;
        };

        // Track if video stalls/buffers
        const onWaiting = () => {
            // Only count buffering on actual content, not during ad playback/transitions
            if (state.detections.videoAd.showing) {
                if (DEBUG_LOGGING) {
                    log.debug('Buffering during ad (ignored)', {
                        videoId: currentVideoId,
                        readyState: videoElement.readyState,
                        adCurrentlyShowing: state.detections.videoAd.showing
                    });
                }
                return;
            }

            // Ignore buffering at start of video (navigation transitions, not real buffering)
            // Real "adblocker punishment" buffering happens during playback (currentTime > 0)
            if (videoElement.currentTime < 0.5) {
                if (DEBUG_LOGGING) {
                    log.debug('Buffering at video start (ignored - likely navigation)', {
                        videoId: currentVideoId,
                        currentTime: videoElement.currentTime,
                        readyState: videoElement.readyState
                    });
                }
                return;
            }

            // Ignore buffering when user is seeking/scrubbing or shortly after a seek
            const recentlySeekd = lastSeekTime && (performance.now() - lastSeekTime < 3000);
            if (videoElement.seeking || recentlySeekd) {
                if (DEBUG_LOGGING) {
                    log.debug('Buffering during/after seek (ignored - user scrubbing)', {
                        videoId: currentVideoId,
                        currentTime: videoElement.currentTime,
                        seeking: videoElement.seeking,
                        msSinceSeek: lastSeekTime ? Math.round(performance.now() - lastSeekTime) : null
                    });
                }
                return;
            }

            // Start tracking buffering duration
            if (!bufferingStartTime) {
                bufferingStartTime = performance.now();
            }

            state.buffering.count++;
            log.info('Video buffering/waiting', {
                videoId: currentVideoId,
                totalBufferingCount: state.buffering.count,
                readyState: videoElement.readyState,
                paused: videoElement.paused,
                seeking: videoElement.seeking,
                currentTime: Math.round(videoElement.currentTime),
                tabHidden: document.hidden,
                networkState: videoElement.networkState,
                adCurrentlyShowing: state.detections.videoAd.showing
            });
        };

        // Track seek events to ignore post-seek buffering
        const onSeeking = () => {
            lastSeekTime = performance.now();
            if (DEBUG_LOGGING) {
                log.debug('User seeking', { videoId: currentVideoId, currentTime: videoElement.currentTime });
            }
        };

        videoElement.addEventListener('loadstart', onLoadStart);
        videoElement.addEventListener('playing', onPlaying);
        videoElement.addEventListener('waiting', onWaiting);
        videoElement.addEventListener('seeking', onSeeking);

        // Track video ID for fresh navigation (we may have missed loadstart)
        const vid = getVideoId();
        if (vid && vid !== lastLoggedVideoId) {
            lastLoggedVideoId = vid;
            currentVideoId = vid;
            state.videoLoads++;
            // Note: For fresh nav, onPlaying will use performance.now() (time since page load)
            // as the load time since videoLoadStartTime won't be set
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

        // Start tracking video load times
        trackVideoLoad(root);

        // Periodic sweep for all detection
        const sweep = () => {
            const sweepStart = performance.now();
            const now = sweepStart;

            // Detect if JS was hung (gap > 3x the interval)
            if (lastSweepTime) {
                const gap = now - lastSweepTime;
                const expectedGap = SWEEP_INTERVAL;

                if (gap > expectedGap * 3) {
                    log.warn('JS hang detected', {
                        expectedMs: expectedGap,
                        actualMs: Math.round(gap),
                        gapMs: Math.round(gap - expectedGap)
                    });
                }
            }

            lastSweepTime = now;

            const currentRoot = getRoot();
            if (!currentRoot) return;

            // Check for video element changes
            trackVideoLoad(currentRoot);

            // Check if ad is currently visible
            const adCheckStart = performance.now();
            const adSelectors = AD_CLASS_EXACT.map(cls => '.' + cls).join(',');
            const adElements = currentRoot.querySelectorAll(adSelectors);
            const hasVisibleAd = Array.from(adElements).some(el => visible(el) && looksLikeAdNode(el));
            const adCheckDuration = performance.now() - adCheckStart;

            // Update ad state
            if (hasVisibleAd && !state.detections.videoAd.showing) {
                reportDetection('videoAd', 'Ad detected!');
            } else if (!hasVisibleAd && state.detections.videoAd.showing) {
                clearDetection('videoAd', 'Ad ended');
            }

            // Check for static overlay ads
            const hasStaticAd = checkStaticOverlayAd();
            if (hasStaticAd && !state.detections.staticAd.showing) {
                reportDetection('staticAd', 'Static overlay ad detected!');
            } else if (!hasStaticAd && state.detections.staticAd.showing) {
                clearDetection('staticAd', 'Static overlay ad ended');
            }

            // Check for playability errors (bot detection, content blocking)
            const playabilityError = checkPlayabilityError();
            if (playabilityError && !state.detections.playabilityError.showing) {
                reportDetection('playabilityError', 'Playability error detected (possible bot detection)', { message: playabilityError });
            } else if (!playabilityError && state.detections.playabilityError.showing) {
                clearDetection('playabilityError', 'Playability error cleared');
            }

            // Check for ad blocker detection modals
            const adBlockerDetected = checkAdBlockerDetection();
            if (adBlockerDetected && !state.detections.adBlocker.showing) {
                reportDetection('adBlocker', 'Ad blocker detection modal detected');
            } else if (!adBlockerDetected && state.detections.adBlocker.showing) {
                clearDetection('adBlocker', 'Ad blocker detection modal cleared');
            }

            // Track performance (keep last 50 + top 5 worst)
            const sweepDuration = performance.now() - sweepStart;
            perfMetrics.sweepDurations.push(sweepDuration);
            perfMetrics.adCheckDurations.push(adCheckDuration);
            perfMetrics.sweepCount++;

            // Track top 5 worst sweep times
            perfMetrics.top5SweepDurations.push(sweepDuration);
            perfMetrics.top5SweepDurations.sort((a, b) => b - a); // Descending
            if (perfMetrics.top5SweepDurations.length > 5) {
                perfMetrics.top5SweepDurations.pop(); // Remove 6th worst
            }

            // Track top 5 worst ad check times
            perfMetrics.top5AdCheckDurations.push(adCheckDuration);
            perfMetrics.top5AdCheckDurations.sort((a, b) => b - a);
            if (perfMetrics.top5AdCheckDurations.length > 5) {
                perfMetrics.top5AdCheckDurations.pop();
            }

            if (sweepDuration > 10) perfMetrics.sweepsOver10ms++;
            if (sweepDuration > 50) perfMetrics.sweepsOver50ms++;

            if (perfMetrics.sweepDurations.length > 50) {
                perfMetrics.sweepDurations.shift();
                perfMetrics.adCheckDurations.shift();
            }
        };

        sweep();
        pollInterval = setInterval(sweep, SWEEP_INTERVAL);

        // Check for player root changes
        rerootInterval = setInterval(() => {
            const r = getRoot();
            if (r && r !== root) {
                log.info('Player root changed, reinitializing');
                if (pollInterval) clearInterval(pollInterval);
                if (rerootInterval) clearInterval(rerootInterval);
                start();
            }
        }, 1000);
    };

    start();

    // Listen for YouTube SPA navigation by intercepting history changes
    let lastUrl = location.href;

    const checkUrlChange = () => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            log.info('SPA navigation detected', {
                from: lastUrl,
                to: currentUrl
            });
            lastUrl = currentUrl;
            // Video tracking will be handled by sweep loop
        }
    };

    // Intercept pushState and replaceState for instant detection
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

    // Also listen for popstate (back/forward buttons)
    window.addEventListener('popstate', checkUrlChange);

    log.info('YouTube ad detector initialized successfully');

    // Expose debug function to window for manual inspection
    // @ts-ignore - Debug helper
    window.ytAdDetectorDebug = () => {
        const totalMs = state.buffering.durations.reduce((sum, dur) => sum + dur, 0);
        const avgMs = state.buffering.durations.length > 0
            ? Math.round(totalMs / state.buffering.durations.length)
            : 0;
        const maxMs = state.buffering.durations.length > 0
            ? Math.max(...state.buffering.durations)
            : 0;

        // Calculate performance stats (only when debug is called)
        const calcStats = (arr) => {
            if (arr.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };
            const sorted = [...arr].sort((a, b) => a - b);
            const sum = sorted.reduce((a, b) => a + b, 0);
            return {
                avg: Math.round((sum / sorted.length) * 100) / 100,
                min: Math.round(sorted[0] * 100) / 100,
                max: Math.round(sorted[sorted.length - 1] * 100) / 100,
                p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 100) / 100
            };
        };

        // Get fresh login state for debug output
        const currentLoginState = detectLoginState();

        console.log('[YT-AdDetect] Current State:', {
            ...state,
            adStats: {
                videoAds: state.detections.videoAd.count,
                staticAds: state.detections.staticAd.count,
                totalAds: state.detections.videoAd.count + state.detections.staticAd.count
            },
            playabilityErrors: {
                count: state.detections.playabilityError.count,
                currentlyShowing: state.detections.playabilityError.showing,
                lastMessage: state.detections.playabilityError.lastMessage
            },
            adBlockerDetection: {
                count: state.detections.adBlocker.count,
                currentlyShowing: state.detections.adBlocker.showing
            },
            bufferingStats: {
                totalMs,
                averageMs: avgMs,
                maxMs,
                durations: state.buffering.durations
            },
            // Login state detection
            loginState: {
                initial: state.loginState?.state,
                current: currentLoginState.state,
                isPremium: currentLoginState.isPremium,
                indicators: currentLoginState.rawIndicators
            },
            currentVideoId,
            lastLoggedVideoId,
            hasVideoElement: !!trackedVideoElement,
            videoElementState: trackedVideoElement ? {
                readyState: trackedVideoElement.readyState,
                paused: trackedVideoElement.paused,
                seeking: trackedVideoElement.seeking,
                currentTime: trackedVideoElement.currentTime,
                duration: trackedVideoElement.duration,
                networkState: trackedVideoElement.networkState
            } : null,
            playerRoot: getRoot()?.id || getRoot()?.className,
            config: {
                SWEEP_INTERVAL,
                SLOW_LOAD_THRESHOLD_MS,
                DEBUG_LOGGING
            },
            performance: {
                sweepCount: perfMetrics.sweepCount,
                sweepStats: calcStats(perfMetrics.sweepDurations),
                adCheckStats: calcStats(perfMetrics.adCheckDurations),
                sampleSize: perfMetrics.sweepDurations.length,
                // All-time worst case
                allTime: {
                    top5WorstSweeps: perfMetrics.top5SweepDurations.map(d => Math.round(d * 100) / 100),
                    top5WorstAdChecks: perfMetrics.top5AdCheckDurations.map(d => Math.round(d * 100) / 100),
                    sweepsOver10ms: perfMetrics.sweepsOver10ms,
                    sweepsOver50ms: perfMetrics.sweepsOver50ms,
                    percentageSlow: Math.round((perfMetrics.sweepsOver10ms / perfMetrics.sweepCount) * 100 * 100) / 100
                }
            }
        });
    };
}

/**
 * Run YouTube ad detection
 * @param {Object} config - Configuration from privacy-config
 * @returns {Object} Detection results in standard format
 */
export function runYoutubeAdDetection(config = {}) {
    // Auto-initialize on first call if on YouTube
    if (!state && window.location.hostname.includes('youtube.com')) {
        initDetector(config);
    }

    // Return empty result if not initialized
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

    // Return minimal data for privacy - no session fingerprinting
    const d = state.detections;

    // If stored login state is unknown, try a fresh check (YouTube globals may be ready now)
    let loginState = state.loginState;
    if (!loginState || loginState.state === 'unknown') {
        // Try fresh detection - globals should be ready by now
        const freshCheck = detectLoginState();
        if (freshCheck.state !== 'unknown') {
            state.loginState = freshCheck;
            loginState = freshCheck;
            log.debug('Fresh login state check at report time:', freshCheck.state);
        }
    }

    // Calculate performance stats for return data
    const perf = state.perfMetrics;
    let perfData = null;

    if (perf && perf.sweepCount > 0) {
        // Calculate stats from recent sweeps
        const sweeps = perf.sweepDurations;
        const adChecks = perf.adCheckDurations;

        const calcAvg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const calcMax = (arr) => arr.length > 0 ? Math.max(...arr) : 0;

        perfData = {
            // Total sweeps executed
            sweepCount: perf.sweepCount,
            // Recent sweep stats (last 50)
            sweepAvgMs: Math.round(calcAvg(sweeps) * 100) / 100,
            sweepMaxMs: Math.round(calcMax(sweeps) * 100) / 100,
            // Ad check subset timing
            adCheckAvgMs: Math.round(calcAvg(adChecks) * 100) / 100,
            adCheckMaxMs: Math.round(calcMax(adChecks) * 100) / 100,
            // All-time slow sweep counts
            sweepsOver10ms: perf.sweepsOver10ms,
            sweepsOver50ms: perf.sweepsOver50ms,
            // Top 5 worst sweep times (all-time)
            top5WorstMs: perf.top5SweepDurations.map(d => Math.round(d * 100) / 100),
            // Percentage of slow sweeps
            pctSlow: Math.round((perf.sweepsOver10ms / perf.sweepCount) * 100 * 100) / 100
        };
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
            // Login state: 'logged-in' | 'logged-out' | 'premium' | 'unknown'
            userState: loginState?.state || 'unknown',
            // Performance metrics for internal testing
            perf: perfData
        }]
    };
}
