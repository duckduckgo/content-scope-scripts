/**
 * @module YouTube Ad Detector
 * @description Lightweight detector for YouTube ad UI elements
 */

import { DetectorBase } from './shared/detector-base.js'
import { isVisible } from './shared/player-utils.js'
import { VideoEventTracker } from './shared/video-events.js'

/**
 * Specific ad-related classes (not broad patterns)
 */
const AD_CLASS_EXACT = [
    'ytp-ad-text',
    'ytp-ad-skip-button',
    'ytp-ad-skip-button-container',
    'ytp-ad-message-container',
    'ytp-ad-player-overlay',
    'ytp-ad-image-overlay',
    'video-ads',
    'ad-showing',
    'ad-interrupting',
    'ad-created'
]

/**
 * Text patterns that indicate ads (must be whole words)
 */
const AD_TEXT_PATTERNS = [
    /\badvertisement\b/i,
    /\bskip ad\b/i,
    /\bskip ads\b/i,
    /^ad\s*[•:·]/i // "Ad •" or "Ad:" at start
]

/**
 * Ad detector implementation using DetectorBase
 */
export class AdDetector extends DetectorBase {
    constructor () {
        super({
            pollInterval: 2000,
            rerootInterval: 1000,
            waitForRootDelay: 500,
            debounceDelay: 80
        })

        this.adCurrentlyPlaying = false
        this.videoTracker = null
    }

    onStart () {
        // Start tracking video events
        this.videoTracker = new VideoEventTracker(this.root)
        this.videoTracker.start()
    }

    onStop () {
        // Stop tracking video events
        if (this.videoTracker) {
            this.videoTracker.stop()
            this.videoTracker = null
        }
    }

    checkNode (node) {
        if (!(node instanceof HTMLElement)) return false

        // Check visibility
        if (!isVisible(node)) return false

        // Check for exact class matches
        const classList = node.classList
        if (classList && AD_CLASS_EXACT.some(adClass => classList.contains(adClass))) {
            return true
        }

        // Also check className string for partial matches (like 'ytp-ad-' prefix)
        const classString = (node.className || '').toString().toLowerCase()
        if (classString.includes('ytp-ad-') || classString.includes('ad-interrupting') || classString.includes('ad-showing')) {
            return true
        }

        // Check text content with precise patterns
        const text = ((node.innerText || '') + ' ' + (node.getAttribute('aria-label') || ''))
        return AD_TEXT_PATTERNS.some(pattern => pattern.test(text))
    }

    getNodesForSweep () {
        // Use specific selectors only
        const selectors = AD_CLASS_EXACT.map(cls => '.' + cls).join(',')
        const nodes = this.root?.querySelectorAll(selectors) || []
        return Array.from(nodes)
    }

    onSweep () {
        // First check the player root itself for ad classes
        if (!this.adCurrentlyPlaying && this.root) {
            const classList = this.root.classList
            if (classList && AD_CLASS_EXACT.some(adClass => classList.contains(adClass))) {
                this.adCurrentlyPlaying = true
                console.log('🎯 YouTube Ad Detected', {
                    time: new Date().toISOString(),
                    element: 'player root has ad classes',
                    classes: Array.from(classList).filter(c => c.includes('ad')),
                    source: 'player-root-sweep'
                })
            }
        }

        // Check if previous ad ended
        this.checkIfAdEnded()
    }

    onDetection (node, source) {
        if (this.adCurrentlyPlaying) {
            return // Already logged this ad
        }

        this.adCurrentlyPlaying = true
        console.log('🎯 YouTube Ad Detected', {
            time: new Date().toISOString(),
            element: node.className || node.textContent?.slice(0, 30) || 'ad element',
            source
        })
    }

    checkIfAdEnded () {
        // First check if player root still has ad classes
        if (this.root) {
            const rootClassList = this.root.classList
            if (rootClassList && AD_CLASS_EXACT.some(adClass => rootClassList.contains(adClass))) {
                return // Ad still showing on player root
            }
        }

        // Check if ad elements are still present
        const selectors = AD_CLASS_EXACT.map(cls => '.' + cls).join(',')
        const adElements = this.root?.querySelectorAll(selectors)

        const hasVisibleAd = adElements && Array.from(adElements).some(el =>
            isVisible(el) && this.checkNode(el)
        )

        if (!hasVisibleAd && this.adCurrentlyPlaying) {
            // Ad ended, reset flag
            this.adCurrentlyPlaying = false
        }
    }
}
