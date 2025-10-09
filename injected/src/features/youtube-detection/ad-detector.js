/**
 * @module YouTube Ad Detector
 * @description Lightweight detector for YouTube ad UI elements
 */

import { DetectorBase } from './shared/detector-base.js'
import { isVisible } from './shared/player-utils.js'
import { VideoEventTracker } from './shared/video-events.js'

/**
 * Classes that indicate an ad is ACTIVELY PLAYING (high confidence)
 */
const AD_CLASS_ACTIVE = [
    'ad-showing',      // Player is showing an ad
    'ad-interrupting'  // Ad is interrupting content
]

/**
 * UI elements that only appear during ads (medium confidence)
 */
const AD_UI_ELEMENTS = [
    'ytp-ad-text',
    'ytp-ad-skip-button',
    'ytp-ad-skip-button-container',
    'ytp-ad-message-container',
    'ytp-ad-player-overlay',
    'ytp-ad-image-overlay'
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

        // Check for UI elements that only appear during ads
        const classList = node.classList
        if (classList && AD_UI_ELEMENTS.some(adClass => classList.contains(adClass))) {
            return true
        }

        // Also check className string for 'ytp-ad-' prefix (but not 'ytp-ad-module')
        const classString = (node.className || '').toString().toLowerCase()
        if (classString.includes('ytp-ad-') && !classString.includes('ytp-ad-module')) {
            return true
        }

        // Check text content with precise patterns
        const text = ((node.innerText || '') + ' ' + (node.getAttribute('aria-label') || ''))
        return AD_TEXT_PATTERNS.some(pattern => pattern.test(text))
    }

    getNodesForSweep () {
        // Use specific selectors only for UI elements
        const selectors = AD_UI_ELEMENTS.map(cls => '.' + cls).join(',')
        const nodes = this.root?.querySelectorAll(selectors) || []
        return Array.from(nodes)
    }

    onSweep () {
        // Check the player root for ACTIVE ad classes only (high confidence)
        if (!this.adCurrentlyPlaying && this.root) {
            const classList = this.root.classList
            if (classList && AD_CLASS_ACTIVE.some(adClass => classList.contains(adClass))) {
                this.adCurrentlyPlaying = true
                console.log('🎯 YouTube Ad Detected', {
                    time: new Date().toISOString(),
                    element: 'player root has ad classes',
                    classes: Array.from(classList).filter(c => c.includes('ad')),
                    source: 'player-root-sweep'
                })
            }
        }

        // Check for sponsored content badges (organic ads)
        if (!this.adCurrentlyPlaying) {
            const sponsoredBadge = document.querySelector('ad-badge-view-model, badge-shape.yt-badge-shape--ad')
            if (sponsoredBadge && isVisible(sponsoredBadge)) {
                const badgeText = sponsoredBadge.textContent?.toLowerCase() || ''
                if (badgeText.includes('sponsored') || badgeText.includes('ad')) {
                    this.adCurrentlyPlaying = true
                    console.log('🎯 YouTube Ad Detected', {
                        time: new Date().toISOString(),
                        element: 'sponsored content badge',
                        text: sponsoredBadge.textContent?.trim(),
                        source: 'sponsored-badge'
                    })
                }
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
        // First check if player root still has ACTIVE ad classes
        if (this.root) {
            const rootClassList = this.root.classList
            if (rootClassList && AD_CLASS_ACTIVE.some(adClass => rootClassList.contains(adClass))) {
                return // Ad still showing on player root
            }
        }

        // Check if ad UI elements are still present and visible
        const selectors = AD_UI_ELEMENTS.map(cls => '.' + cls).join(',')
        const adElements = this.root?.querySelectorAll(selectors)

        const hasVisibleAd = adElements && Array.from(adElements).some(el =>
            isVisible(el) && this.checkNode(el)
        )

        // Also check if sponsored badge is still visible
        const sponsoredBadge = document.querySelector('ad-badge-view-model, badge-shape.yt-badge-shape--ad')
        const hasSponsoredBadge = sponsoredBadge && isVisible(sponsoredBadge)

        if (!hasVisibleAd && !hasSponsoredBadge && this.adCurrentlyPlaying) {
            // Ad ended, reset flag
            this.adCurrentlyPlaying = false
            console.log('✅ YouTube Ad Ended', {
                time: new Date().toISOString()
            })
        }
    }
}
