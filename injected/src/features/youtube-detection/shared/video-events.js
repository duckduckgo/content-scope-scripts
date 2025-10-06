/**
 * @module YouTube Video Events
 * @description Utilities for tracking video element events and metrics
 */

import { getVideoElement, getVideoId } from './player-utils.js'

/**
 * Video event tracker that monitors loadstart, playing, and waiting events
 */
export class VideoEventTracker {
    constructor (playerRoot, options = {}) {
        this.playerRoot = playerRoot
        this.maxRetries = options.maxRetries || 10
        this.retryDelay = options.retryDelay || 500

        this.videoElement = null
        this.listeners = null
        this.videoLoadStartTime = null
        this.currentVideoId = null
    }

    /**
     * Start tracking video events
     * @param {number} retryCount - Current retry attempt
     */
    start (retryCount = 0) {
        this.videoElement = getVideoElement(this.playerRoot)

        if (!this.videoElement) {
            if (retryCount < this.maxRetries) {
                setTimeout(() => this.start(retryCount + 1), this.retryDelay)
            } else {
                console.warn('[video-events] Video element not found after', this.maxRetries, 'retries')
            }
            return
        }

        // Clean up old listeners if they exist
        this.stop()

        // Create event handlers
        const loadstartHandler = () => this.handleLoadStart()
        const playingHandler = () => this.handlePlaying()
        const waitingHandler = () => this.handleWaiting()

        // Attach listeners
        this.videoElement.addEventListener('loadstart', loadstartHandler)
        this.videoElement.addEventListener('playing', playingHandler)
        this.videoElement.addEventListener('waiting', waitingHandler)

        // Store listener references for cleanup
        this.listeners = [
            { element: this.videoElement, event: 'loadstart', handler: loadstartHandler },
            { element: this.videoElement, event: 'playing', handler: playingHandler },
            { element: this.videoElement, event: 'waiting', handler: waitingHandler }
        ]

        console.log('[video-events] Started tracking')
    }

    /**
     * Stop tracking and clean up listeners
     */
    stop () {
        if (this.listeners) {
            this.listeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler)
            })
            this.listeners = null
        }
    }

    /**
     * Handle loadstart event
     */
    handleLoadStart () {
        const videoId = getVideoId()
        if (videoId) {
            this.currentVideoId = videoId
            this.videoLoadStartTime = performance.now()
            console.log('⏱️ Video Load Started', {
                videoId: this.currentVideoId,
                url: window.location.href,
                time: new Date().toISOString()
            })
        }
    }

    /**
     * Handle playing event
     */
    handlePlaying () {
        if (this.videoLoadStartTime) {
            const loadTime = performance.now() - this.videoLoadStartTime
            console.log('▶️ Video Started Playing', {
                videoId: this.currentVideoId,
                loadTimeMs: Math.round(loadTime),
                loadTimeSec: (loadTime / 1000).toFixed(2) + 's',
                time: new Date().toISOString()
            })
            this.videoLoadStartTime = null // Reset for next video
        }
    }

    /**
     * Handle waiting (buffering) event
     */
    handleWaiting () {
        console.log('⏸️ Video Buffering', {
            videoId: this.currentVideoId,
            time: new Date().toISOString()
        })
    }
}
