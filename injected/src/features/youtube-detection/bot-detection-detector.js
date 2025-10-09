/**
 * @module YouTube Bot Detection Detector
 * @description Detects when YouTube flags the user as a bot
 */

/**
 * Bot detection types
 * @enum {string}
 */
export const BotDetectionType = {
    NONE: 'none',
    VIDEO_UNAVAILABLE: 'video_unavailable',
    CONFIRM_NOT_BOT: 'confirm_not_bot',
    UNPLAYABLE: 'unplayable'
}

/**
 * Detects bot detection screens on YouTube
 */
export class BotDetectionDetector {
    constructor () {
        this.lastDetection = null
        this.navigationObserver = null
        this.navigationTimeout = null
    }

    /**
     * Start monitoring for bot detection
     * @param {Function} onBotDetected - Callback when bot detection is found
     */
    start (onBotDetected) {
        this.onBotDetected = onBotDetected

        // Wait for DOM to be ready, then do initial detection
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.checkForBotDetection(), 500)
            })
        } else {
            // DOM already ready
            setTimeout(() => this.checkForBotDetection(), 500)
        }

        // Set up navigation observer
        this.setupNavigationObserver()

        // Also listen for popstate (back/forward navigation)
        this.popstateHandler = () => {
            clearTimeout(this.navigationTimeout)
            this.navigationTimeout = setTimeout(() => {
                this.checkForBotDetection()
            }, 1000)
        }
        window.addEventListener('popstate', this.popstateHandler)
    }

    /**
     * Set up navigation observer (with fallback if ytd-app doesn't exist)
     */
    setupNavigationObserver () {
        this.navigationObserver = new MutationObserver((mutations) => {
            // Check if any bot detection elements were added
            const hasBotElements = mutations.some(mutation => {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const tagName = node.tagName?.toLowerCase()
                            // Check if error/playability renderers were added
                            if (tagName?.includes('error') || tagName?.includes('playability')) {
                                return true
                            }
                        }
                    }
                }
                return false
            })

            // If bot elements detected, check immediately; otherwise debounce
            clearTimeout(this.navigationTimeout)
            clearTimeout(this.retryTimeout)

            const delay = hasBotElements ? 100 : 1000
            this.navigationTimeout = setTimeout(() => {
                this.checkForBotDetection()

                // Retry after 2 more seconds if no detection (elements may load late)
                this.retryTimeout = setTimeout(() => {
                    this.checkForBotDetection()
                }, 2000)
            }, delay)
        })

        // Try to watch ytd-app (normal YouTube)
        const ytdApp = document.querySelector('ytd-app')
        if (ytdApp) {
            // Watch both attribute changes (navigation) and child changes (bot detection elements)
            this.navigationObserver.observe(ytdApp, {
                attributes: true,
                attributeFilter: ['page-subtype'],
                childList: true,
                subtree: true
            })
        } else {
            // Fallback: watch document.body if ytd-app doesn't exist (bot detected page)
            if (document.body) {
                this.navigationObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                })
            }
        }
    }

    /**
     * Stop monitoring for bot detection
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
     * Check if bot detection is present
     * @returns {Object|null} Detection info or null if no detection
     */
    checkForBotDetection () {
        const detection = this.detectBot()

        // Only fire callback if detection changed
        const detectionKey = detection ? `${detection.type}-${detection.reason}` : null
        const lastKey = this.lastDetection ? `${this.lastDetection.type}-${this.lastDetection.reason}` : null

        if (detectionKey !== lastKey) {
            this.lastDetection = detection

            if (detection && this.onBotDetected) {
                this.onBotDetected(detection)
            }

            // Log for debugging
            if (detection) {
                console.log('🤖 YouTube Bot Detection', detection)
            }
        }

        return detection
    }

    /**
     * Detect bot detection from various sources
     * @returns {Object|null}
     */
    detectBot () {
        // Check DOM first (more reliable than ytInitialPlayerResponse for bot detection)
        const domDetection = this.checkDOMForBotDetection()
        if (domDetection) {
            return domDetection
        }

        // Fallback to ytInitialPlayerResponse if available
        if (window.ytInitialPlayerResponse?.playabilityStatus) {
            const status = window.ytInitialPlayerResponse.playabilityStatus
            const statusType = status.status
            const reason = status.reason || ''

            // "Video unavailable" - common for bot detection
            if (statusType === 'UNPLAYABLE' &&
                (reason.toLowerCase().includes('unavailable') ||
                 reason.toLowerCase().includes("isn't available") ||
                 reason.toLowerCase().includes("content isn't available"))) {
                return {
                    type: BotDetectionType.VIDEO_UNAVAILABLE,
                    status: statusType,
                    reason: reason,
                    videoId: window.ytInitialPlayerResponse.videoDetails?.videoId
                }
            }

            // "Sign in to confirm you're not a bot"
            if ((statusType === 'LOGIN_REQUIRED' || statusType === 'UNPLAYABLE') &&
                (reason.toLowerCase().includes('bot') ||
                 reason.toLowerCase().includes("confirm you're not") ||
                 reason.toLowerCase().includes('protect our community'))) {
                return {
                    type: BotDetectionType.CONFIRM_NOT_BOT,
                    status: statusType,
                    reason: reason,
                    videoId: window.ytInitialPlayerResponse.videoDetails?.videoId
                }
            }

            // Generic unplayable that might be bot-related
            if (statusType === 'UNPLAYABLE' || statusType === 'ERROR') {
                return {
                    type: BotDetectionType.UNPLAYABLE,
                    status: statusType,
                    reason: reason,
                    videoId: window.ytInitialPlayerResponse.videoDetails?.videoId
                }
            }
        }

        return null
    }

    /**
     * Check DOM for bot detection messages
     * @returns {Object|null}
     */
    checkDOMForBotDetection () {
        const botMessages = [
            "sign in to confirm you're not a bot",
            "confirm you're not a bot",
            'protect our community',
            "video unavailable",
            "this content isn't available",
            "content isn't available"
        ]

        // Check yt-player-error-message-renderer (most common for bot detection)
        const playerErrorRenderer = document.querySelector('yt-player-error-message-renderer')
        if (playerErrorRenderer) {
            const errorText = playerErrorRenderer.textContent?.toLowerCase() || ''
            for (const msg of botMessages) {
                if (errorText.includes(msg)) {
                    return {
                        type: msg.includes('bot') ? BotDetectionType.CONFIRM_NOT_BOT : BotDetectionType.VIDEO_UNAVAILABLE,
                        status: 'DOM_PLAYER_ERROR',
                        reason: playerErrorRenderer.textContent?.trim().slice(0, 200) || 'Player error detected',
                        videoId: this.getCurrentVideoId()
                    }
                }
            }
        }

        // Check yt-playability-error-supported-renderers
        const playabilityError = document.querySelector('yt-playability-error-supported-renderers')
        if (playabilityError) {
            const errorText = playabilityError.textContent?.toLowerCase() || ''
            for (const msg of botMessages) {
                if (errorText.includes(msg)) {
                    return {
                        type: msg.includes('bot') ? BotDetectionType.CONFIRM_NOT_BOT : BotDetectionType.VIDEO_UNAVAILABLE,
                        status: 'DOM_PLAYABILITY_ERROR',
                        reason: playabilityError.textContent?.trim().slice(0, 200) || 'Playability error detected',
                        videoId: this.getCurrentVideoId()
                    }
                }
            }
        }

        // Check yt-player-interstitial-renderer (used in Shorts)
        const interstitialRenderer = document.querySelector('yt-player-interstitial-renderer')
        if (interstitialRenderer) {
            const errorText = (interstitialRenderer.textContent || interstitialRenderer.innerText || '').toLowerCase()
            for (const msg of botMessages) {
                if (errorText.includes(msg)) {
                    return {
                        type: msg.includes('bot') ? BotDetectionType.CONFIRM_NOT_BOT : BotDetectionType.VIDEO_UNAVAILABLE,
                        status: 'DOM_INTERSTITIAL_RENDERER',
                        reason: (interstitialRenderer.textContent || interstitialRenderer.innerText || '').trim().slice(0, 200) || 'Interstitial error detected',
                        videoId: this.getCurrentVideoId()
                    }
                }
            }
        }

        // Check generic player errors
        const playerError = document.querySelector('.ytp-error, .ytp-error-content')
        if (playerError) {
            const errorText = playerError.textContent?.toLowerCase() || ''
            for (const msg of botMessages) {
                if (errorText.includes(msg)) {
                    return {
                        type: msg.includes('bot') ? BotDetectionType.CONFIRM_NOT_BOT : BotDetectionType.VIDEO_UNAVAILABLE,
                        status: 'DOM_YTP_ERROR',
                        reason: playerError.textContent?.trim().slice(0, 200) || 'Player error detected',
                        videoId: this.getCurrentVideoId()
                    }
                }
            }
        }

        // Check for error screens/promos
        const errorScreens = document.querySelectorAll('ytd-background-promo-renderer, [class*="error-screen"]')
        for (const screen of errorScreens) {
            const text = screen.textContent?.toLowerCase() || ''
            for (const msg of botMessages) {
                if (text.includes(msg)) {
                    return {
                        type: msg.includes('bot') ? BotDetectionType.CONFIRM_NOT_BOT : BotDetectionType.VIDEO_UNAVAILABLE,
                        status: 'DOM_ERROR_SCREEN',
                        reason: screen.textContent?.trim().slice(0, 200) || 'Error screen detected',
                        videoId: this.getCurrentVideoId()
                    }
                }
            }
        }

        return null
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
