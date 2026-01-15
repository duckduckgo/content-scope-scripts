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
const LOG_PREFIX = '[YT-AdDetect]';
const log = {
    info: (...args) => console.log(LOG_PREFIX, ...args),
    warn: (...args) => console.warn(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
    debug: (...args) => console.debug(LOG_PREFIX, ...args)
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

    // Text patterns that indicate ads
    const AD_TEXT_PATTERNS = [
        /\badvertisement\b/i,
        /\bskip ad\b/i,
        /\bskip ads\b/i,
        /^ad\s*[•:·]/i
    ];

    // Initialize state
    state = {
        adsDetected: 0,
        adCurrentlyShowing: false,
        bufferingCount: 0,
        bufferingDurations: [], // Array of buffering durations in ms
        videoLoads: 0
    };

    let trackedVideoElement = null;
    let lastLoggedVideoId = null;
    let currentVideoId = null;
    let videoLoadStartTime = null;
    let bufferingStartTime = null;
    let lastSweepTime = null;

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
     * Get current video ID from URL
     */
    const getVideoId = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    };

    /**
     * Report ad detection
     */
    const reportAd = () => {
        if (state.adCurrentlyShowing) {
            return; // Already detected
        }
        state.adCurrentlyShowing = true;
        state.adsDetected++;
        log.info('Ad detected!', {
            totalAdsDetected: state.adsDetected,
            videoId: currentVideoId,
            url: window.location.href
        });
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
        const onPlaying = () => {
            // Track end of buffering period
            if (bufferingStartTime) {
                const bufferingDuration = performance.now() - bufferingStartTime;
                state.bufferingDurations.push(Math.round(bufferingDuration));
                if (DEBUG_LOGGING) {
                    log.debug('Buffering ended', {
                        videoId: currentVideoId,
                        durationMs: Math.round(bufferingDuration)
                    });
                }
                bufferingStartTime = null;
            }

            if (videoLoadStartTime) {
                const loadTime = performance.now() - videoLoadStartTime;
                const isSlow = loadTime > SLOW_LOAD_THRESHOLD_MS;
                const duringAd = state.adCurrentlyShowing;

                if (DEBUG_LOGGING) {
                    log.debug('Video playing event', {
                        videoId: currentVideoId,
                        loadTimeMs: Math.round(loadTime),
                        threshold: SLOW_LOAD_THRESHOLD_MS,
                        willCountAsBuffering: isSlow && !duringAd,
                        readyState: videoElement.readyState,
                        paused: videoElement.paused,
                        seeking: videoElement.seeking,
                        tabHidden: document.hidden,
                        adCurrentlyShowing: duringAd
                    });
                }

                if (isSlow && !duringAd) {
                    state.bufferingCount++;
                    state.bufferingDurations.push(Math.round(loadTime));
                    log.info('Slow video load (buffering)', {
                        videoId: currentVideoId,
                        loadTimeMs: Math.round(loadTime),
                        totalBufferingCount: state.bufferingCount,
                        readyState: videoElement.readyState
                    });
                }
                videoLoadStartTime = null;
            }
        };

        // Track if video stalls/buffers
        const onWaiting = () => {
            // Only count buffering on actual content, not during ad playback/transitions
            if (state.adCurrentlyShowing) {
                if (DEBUG_LOGGING) {
                    log.debug('Buffering during ad (ignored)', {
                        videoId: currentVideoId,
                        readyState: videoElement.readyState,
                        adCurrentlyShowing: state.adCurrentlyShowing
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

            // Ignore buffering when user is seeking/scrubbing
            if (videoElement.seeking) {
                if (DEBUG_LOGGING) {
                    log.debug('Buffering during seek (ignored - user scrubbing)', {
                        videoId: currentVideoId,
                        currentTime: videoElement.currentTime,
                        seeking: videoElement.seeking
                    });
                }
                return;
            }

            // Start tracking buffering duration
            if (!bufferingStartTime) {
                bufferingStartTime = performance.now();
            }

            state.bufferingCount++;
            log.info('Video buffering/waiting', {
                videoId: currentVideoId,
                totalBufferingCount: state.bufferingCount,
                readyState: videoElement.readyState,
                paused: videoElement.paused,
                seeking: videoElement.seeking,
                currentTime: Math.round(videoElement.currentTime),
                tabHidden: document.hidden,
                networkState: videoElement.networkState,
                adCurrentlyShowing: state.adCurrentlyShowing
            });
        };

        videoElement.addEventListener('loadstart', onLoadStart);
        videoElement.addEventListener('playing', onPlaying);
        videoElement.addEventListener('waiting', onWaiting);

        // Check if video already has data (we missed loadstart)
        // readyState: 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
        const vid = getVideoId();
        if (videoElement.readyState >= 1 || !videoElement.paused) {
            if (vid && vid !== lastLoggedVideoId) {
                lastLoggedVideoId = vid;
                currentVideoId = vid;
                state.videoLoads++;
                // Can't measure accurate load time since we missed loadstart
            }
        } else if (vid) {
            // Video not ready yet but we have an ID - set up to catch it
            lastLoggedVideoId = null; // Reset so loadstart can catch it
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
            const now = performance.now();
            
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
            const adSelectors = AD_CLASS_EXACT.map(cls => '.' + cls).join(',');
            const adElements = currentRoot.querySelectorAll(adSelectors);
            const hasVisibleAd = Array.from(adElements).some(el => visible(el) && looksLikeAdNode(el));

            // Update ad state
            if (hasVisibleAd && !state.adCurrentlyShowing) {
                reportAd();
            } else if (!hasVisibleAd && state.adCurrentlyShowing) {
                state.adCurrentlyShowing = false;
                log.info('Ad ended', {
                    totalAdsDetected: state.adsDetected,
                    videoId: currentVideoId
                });
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
        const totalMs = state.bufferingDurations.reduce((sum, dur) => sum + dur, 0);
        const avgMs = state.bufferingDurations.length > 0
            ? Math.round(totalMs / state.bufferingDurations.length)
            : 0;
        const maxMs = state.bufferingDurations.length > 0
            ? Math.max(...state.bufferingDurations)
            : 0;

        console.log('[YT-AdDetect] Current State:', {
            ...state,
            bufferingStats: {
                totalMs,
                averageMs: avgMs,
                maxMs,
                durations: state.bufferingDurations
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
    const totalBufferingMs = state.bufferingDurations.reduce((sum, dur) => sum + dur, 0);
    const avgBufferingMs = state.bufferingDurations.length > 0
        ? totalBufferingMs / state.bufferingDurations.length
        : 0;
    const bufferAvgSec = Math.round(avgBufferingMs / 1000);

    // Return minimal data for privacy - no session fingerprinting
    return {
        detected: state.adsDetected > 0 || state.bufferingCount > 0,
        type: 'youtubeAds',
        results: [{
            adsDetected: state.adsDetected,
            bufferingCount: state.bufferingCount,
            bufferAvgSec: bufferAvgSec
        }]
    };
}


