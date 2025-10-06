/**
 * @module YouTube Buffer Detector
 * @description Lightweight detector for YouTube buffering events
 */

import { DetectorBase } from './shared/detector-base.js'
import { isVisible } from './shared/player-utils.js'

/**
 * Classes and attributes that indicate buffering
 */
const BUFFER_INDICATORS = [
    'ytp-spinner',
    'ytp-spinner-container',
    'ytp-loading-spinner'
]

/**
 * Buffer detector implementation using DetectorBase
 */
export class BufferDetector extends DetectorBase {
    constructor () {
        super({
            pollInterval: 1000, // Check more frequently for buffering
            rerootInterval: 1000,
            waitForRootDelay: 500,
            debounceDelay: 100
        })

        this.isBuffering = false
    }

    checkNode (node) {
        if (!(node instanceof HTMLElement)) return false

        // Check visibility
        if (!isVisible(node)) return false

        // Check for buffering class indicators
        const classList = node.classList
        return classList && BUFFER_INDICATORS.some(indicator => classList.contains(indicator))
    }

    getNodesForSweep () {
        // Use specific selectors for buffering indicators
        const selectors = BUFFER_INDICATORS.map(cls => '.' + cls).join(',')
        const nodes = this.root?.querySelectorAll(selectors) || []
        return Array.from(nodes)
    }

    onDetection (node, source) {
        if (this.isBuffering) {
            return // Already in buffering state
        }

        this.isBuffering = true
        console.log('⏳ Buffering Started', {
            time: new Date().toISOString(),
            element: node.className || 'buffer indicator',
            source
        })
    }

    onSweep () {
        // Check if buffering has ended
        const selectors = BUFFER_INDICATORS.map(cls => '.' + cls).join(',')
        const bufferElements = this.root?.querySelectorAll(selectors)

        const hasVisibleBuffer = bufferElements && Array.from(bufferElements).some(el =>
            isVisible(el)
        )

        if (!hasVisibleBuffer && this.isBuffering) {
            // Buffering ended
            this.isBuffering = false
            console.log('✅ Buffering Ended', {
                time: new Date().toISOString()
            })
        }
    }
}
