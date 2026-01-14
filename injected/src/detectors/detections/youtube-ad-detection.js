/**
 * Module-level state for YouTube ad detection
 * Persists across multiple calls to runYoutubeAdDetection
 */
let state = null;
let observer = null;
let pollInterval = null;
let rerootInterval = null;

/**
 * Initialize the YouTube ad detector
 * @param {Object} config - Configuration from privacy-config
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
        videoLoads: 0
    };

    let trackedVideoElement = null;
    let lastLoggedVideoId = null;
    let currentVideoId = null;
    let videoLoadStartTime = null;

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
    };

    /**
     * Check if ad has ended
     */
    const checkIfAdEnded = (root) => {
        if (!state.adCurrentlyShowing) return;

        const selectors = AD_CLASS_EXACT.map(cls => '.' + cls).join(',');
        const adElements = root?.querySelectorAll(selectors);
        const hasVisibleAd = adElements && Array.from(adElements).some(el => visible(el) && looksLikeAdNode(el));

        if (!hasVisibleAd) {
            state.adCurrentlyShowing = false;
        }
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
            }
        };

        // Track when video actually starts playing - count slow loads as buffering
        const onPlaying = () => {
            if (videoLoadStartTime) {
                const loadTime = performance.now() - videoLoadStartTime;
                if (loadTime > SLOW_LOAD_THRESHOLD_MS) {
                    state.bufferingCount++;
                }
                videoLoadStartTime = null;
            }
        };

        // Track if video stalls/buffers
        const onWaiting = () => {
            state.bufferingCount++;
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
                // Can't measure accurate load time since we missed loadstart,
                // but record that a video loaded
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

        const seen = new WeakSet();
        let pend = null;
        let timer;

        // MutationObserver to detect ad elements
        observer = new MutationObserver(muts => {
            let hit = false;
            for (const m of muts) {
                if (m.type === 'characterData' && m.target?.parentElement) {
                    const p = m.target.parentElement;
                    if (!seen.has(p) && looksLikeAdNode(p) && visible(p)) {
                        seen.add(p);
                        pend = p;
                        hit = true;
                    }
                }
                const candidates = [m.target, ...m.addedNodes].filter(Boolean);
                for (const n of candidates) {
                    if (seen.has(n)) continue;
                    if (looksLikeAdNode(n) && visible(n)) {
                        seen.add(n);
                        pend = n;
                        hit = true;
                    }
                }
            }
            if (hit) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    if (pend) {
                        reportAd();
                    }
                }, 80);
            }
        });

        observer.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeFilter: ['class', 'style', 'aria-label']
        });

        // Periodic sweep for ads
        const sweep = () => {
            // Check if previous ad ended
            checkIfAdEnded(root);

            // Check for video element changes
            trackVideoLoad(root);

            // Look for new ads using specific selectors
            const selectors = AD_CLASS_EXACT.map(cls => '.' + cls).join(',');
            const nodes = root.querySelectorAll(selectors);

            for (const n of nodes) {
                if (!seen.has(n) && visible(n) && looksLikeAdNode(n)) {
                    seen.add(n);
                    reportAd();
                    break;
                }
            }
        };

        sweep();
        pollInterval = setInterval(sweep, SWEEP_INTERVAL);

        // Check for player root changes
        rerootInterval = setInterval(() => {
            const r = getRoot();
            if (r && r !== root) {
                if (observer) observer.disconnect();
                if (pollInterval) clearInterval(pollInterval);
                if (rerootInterval) clearInterval(rerootInterval);
                start();
            }
        }, 1000);
    };

    start();

    // Listen for YouTube SPA navigation
    let lastUrl = location.href;
    new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            // Video tracking will be handled by sweep loop
        }
    }).observe(document, { subtree: true, childList: true });
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

    // Return accumulated state matching bot/fraud detector structure
    return {
        detected: state.adsDetected > 0 || state.bufferingCount > 0,
        type: 'youtubeAds',
        results: [{
            adsDetected: state.adsDetected,
            adCurrentlyShowing: state.adCurrentlyShowing,
            bufferingCount: state.bufferingCount,
            videoLoads: state.videoLoads
        }]
    };
}


