/**
 * @module YouTube Breakage Detector
 * @description Detects when YouTube video playback fails or errors occur
 */

/**
 * Breakage types
 * @enum {string}
 */
export const BreakageType = {
    NONE: 'none',
    PLAYBACK_ERROR: 'playback_error',
    SOMETHING_WENT_WRONG: 'something_went_wrong',
    VIDEO_UNAVAILABLE: 'video_unavailable',
    GENERIC_ERROR: 'generic_error'
}

/**
 * Detects playback errors and breakage on YouTube
 */
export class BreakageDetector {
    constructor () {
        this.lastDetection = null
        this.navigationObserver = null
        this.navigationTimeout = null
        this.retryTimeout = null
    }

    /**
     * Start monitoring for breakage
     * @param {Function} onBreakageDetected - Callback when breakage is found
     */
    start (onBreakageDetected) {
        this.onBreakageDetected = onBreakageDetected

        // Wait for DOM to be ready, then do initial detection
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.checkForBreakage(), 500)
            })
        } else {
            // DOM already ready
            setTimeout(() => this.checkForBreakage(), 500)
        }

        // Set up navigation observer
        this.setupNavigationObserver()

        // Also listen for popstate (back/forward navigation)
        this.popstateHandler = () => {
            clearTimeout(this.navigationTimeout)
            this.navigationTimeout = setTimeout(() => {
                this.checkForBreakage()
            }, 1000)
        }
        window.addEventListener('popstate', this.popstateHandler)
    }

    /**
     * Set up navigation observer (with fallback if ytd-app doesn't exist)
     */
    setupNavigationObserver () {
        this.navigationObserver = new MutationObserver((mutations) => {
            // Check if any error/playability renderers were added
            const hasErrorElements = mutations.some(mutation => {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const tagName = node.tagName?.toLowerCase()
                            const className = node.className?.toString().toLowerCase() || ''
                            // Check if error/playability renderers were added
                            if (tagName?.includes('error') ||
                                tagName?.includes('playability') ||
                                className.includes('ytp-error')) {
                                return true
                            }
                        }
                    }
                }
                return false
            })

            // If error elements detected, check immediately; otherwise debounce
            clearTimeout(this.navigationTimeout)
            clearTimeout(this.retryTimeout)

            const delay = hasErrorElements ? 100 : 1000
            this.navigationTimeout = setTimeout(() => {
                this.checkForBreakage()

                // Retry after 2 more seconds if no detection (elements may load late)
                this.retryTimeout = setTimeout(() => {
                    this.checkForBreakage()
                }, 2000)
            }, delay)
        })

        // Try to watch ytd-app (normal YouTube)
        const ytdApp = document.querySelector('ytd-app')
        if (ytdApp) {
            // Watch both attribute changes (navigation) and child changes (error elements)
            this.navigationObserver.observe(ytdApp, {
                attributes: true,
                attributeFilter: ['page-subtype'],
                childList: true,
                subtree: true
            })
        } else {
            // Fallback: watch document.body if ytd-app doesn't exist
            if (document.body) {
                this.navigationObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                })
            }
        }
    }

    /**
     * Stop monitoring for breakage
     */
    stop () {
        if (this.navigationObserver) {
            this.navigationObserver.disconnect()
            this.navigationObserver = null
        }
        if (this.navigationTimeout) {
            clearTimeout(this.navigationTimeout)
            this.navigationTimeout = null
        }
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout)
            this.retryTimeout = null
        }
        if (this.popstateHandler) {
            window.removeEventListener('popstate', this.popstateHandler)
            this.popstateHandler = null
        }
    }

    /**
     * Check if breakage is present
     * @returns {Object|null} Detection info or null if no detection
     */
    checkForBreakage () {
        const detection = this.detectBreakage()

        // Only fire callback if detection changed
        const detectionKey = detection ? `${detection.type}-${detection.reason}` : null
        const lastKey = this.lastDetection ? `${this.lastDetection.type}-${this.lastDetection.reason}` : null

        if (detectionKey !== lastKey) {
            this.lastDetection = detection

            if (detection && this.onBreakageDetected) {
                this.onBreakageDetected(detection)
            }

            // Log for debugging
            if (detection) {
                console.log('⚠️ YouTube Breakage Detected', detection)
            }
        }

        return detection
    }

    /**
     * Detect breakage from various sources
     * @returns {Object|null}
     */
    detectBreakage () {
        // Check DOM first (more reliable)
        const domDetection = this.checkDOMForBreakage()
        if (domDetection) {
            return domDetection
        }

        // Fallback to ytInitialPlayerResponse if available
        if (window.ytInitialPlayerResponse?.playabilityStatus) {
            const status = window.ytInitialPlayerResponse.playabilityStatus
            const statusType = status.status
            const reason = status.reason || ''

            // Check for error states
            if (statusType === 'ERROR' || statusType === 'UNPLAYABLE') {
                return {
                    type: BreakageType.PLAYBACK_ERROR,
                    status: statusType,
                    reason: reason,
                    videoId: window.ytInitialPlayerResponse.videoDetails?.videoId
                }
            }
        }

        return null
    }

    /**
     * Check DOM for breakage/error messages
     * @returns {Object|null}
     */
    checkDOMForBreakage () {
        const breakageMessages = [
            'something went wrong',
            'refresh or try again',
            'video unavailable',
            "this content isn't available",
            "content isn't available",
            'playback error',
            'an error occurred'
        ]

        // Check .ytp-error and .ytp-error-content (standard player errors)
        const playerError = document.querySelector('.ytp-error, .ytp-error-content')
        if (playerError) {
            const errorText = (playerError.textContent || playerError.innerText || '').toLowerCase()
            for (const msg of breakageMessages) {
                if (errorText.includes(msg)) {
                    return {
                        type: this.categorizeBreakage(errorText),
                        status: 'DOM_PLAYER_ERROR',
                        reason: (playerError.textContent || playerError.innerText || '').trim().slice(0, 200) || 'Player error detected',
                        videoId: this.getCurrentVideoId()
                    }
                }
            }
        }

        // Check yt-player-error-message-renderer
        const playerErrorRenderer = document.querySelector('yt-player-error-message-renderer')
        if (playerErrorRenderer) {
            const errorText = (playerErrorRenderer.textContent || playerErrorRenderer.innerText || '').toLowerCase()
            for (const msg of breakageMessages) {
                if (errorText.includes(msg)) {
                    return {
                        type: this.categorizeBreakage(errorText),
                        status: 'DOM_PLAYER_ERROR_RENDERER',
                        reason: (playerErrorRenderer.textContent || playerErrorRenderer.innerText || '').trim().slice(0, 200) || 'Player error detected',
                        videoId: this.getCurrentVideoId()
                    }
                }
            }
        }

        // Check yt-playability-error-supported-renderers
        const playabilityError = document.querySelector('yt-playability-error-supported-renderers')
        if (playabilityError) {
            const errorText = (playabilityError.textContent || playabilityError.innerText || '').toLowerCase()
            for (const msg of breakageMessages) {
                if (errorText.includes(msg)) {
                    return {
                        type: this.categorizeBreakage(errorText),
                        status: 'DOM_PLAYABILITY_ERROR',
                        reason: (playabilityError.textContent || playabilityError.innerText || '').trim().slice(0, 200) || 'Playability error detected',
                        videoId: this.getCurrentVideoId()
                    }
                }
            }
        }

        // Check yt-player-interstitial-renderer (used in Shorts)
        const interstitialRenderer = document.querySelector('yt-player-interstitial-renderer')
        if (interstitialRenderer) {
            const errorText = (interstitialRenderer.textContent || interstitialRenderer.innerText || '').toLowerCase()
            for (const msg of breakageMessages) {
                if (errorText.includes(msg)) {
                    return {
                        type: this.categorizeBreakage(errorText),
                        status: 'DOM_INTERSTITIAL_RENDERER',
                        reason: (interstitialRenderer.textContent || interstitialRenderer.innerText || '').trim().slice(0, 200) || 'Interstitial error detected',
                        videoId: this.getCurrentVideoId()
                    }
                }
            }
        }

        return null
    }

    /**
     * Categorize the type of breakage based on error text
     * @param {string} errorText - Lowercase error text
     * @returns {BreakageType}
     */
    categorizeBreakage (errorText) {
        if (errorText.includes('something went wrong') || errorText.includes('refresh or try again')) {
            return BreakageType.SOMETHING_WENT_WRONG
        }
        if (errorText.includes('video unavailable') || errorText.includes("content isn't available")) {
            return BreakageType.VIDEO_UNAVAILABLE
        }
        if (errorText.includes('playback error') || errorText.includes('an error occurred')) {
            return BreakageType.PLAYBACK_ERROR
        }
        return BreakageType.GENERIC_ERROR
    }

    /**
     * Get current video ID from URL
     * @returns {string|null}
     */
    getCurrentVideoId () {
        const urlParams = new URLSearchParams(window.location.search)
        return urlParams.get('v')
    }

    /**
     * Get current detection status
     * @returns {Object|null}
     */
    getCurrentDetection () {
        return this.lastDetection
    }
}
