/**
 * @module YouTube Detector Base
 * @description Base class for YouTube detection modules with common observer and polling logic
 */

import { getPlayerRoot } from './player-utils.js'

/**
 * Base class for YouTube detectors that provides common functionality:
 * - MutationObserver setup
 * - Polling mechanism
 * - Re-rooting when player changes
 * - Lifecycle management
 */
export class DetectorBase {
    constructor (options = {}) {
        this.pollInterval = options.pollInterval || 2000
        this.rerootInterval = options.rerootInterval || 1000
        this.waitForRootDelay = options.waitForRootDelay || 500
        this.debounceDelay = options.debounceDelay || 80

        this.root = null
        this.observer = null
        this.pollTimer = null
        this.rerootTimer = null
        this.seen = new WeakSet()
        this.pendingNode = null
        this.debounceTimer = null
    }

    /**
     * Start the detector
     */
    start () {
        this.root = getPlayerRoot()
        if (!this.root) {
            console.log('[detector] Waiting for player root...')
            setTimeout(() => this.start(), this.waitForRootDelay)
            return
        }

        console.log('[detector] Player root found:', this.root.id || this.root.className)

        // Call subclass initialization
        this.onStart?.()

        // Setup mutation observer
        this.observer = new MutationObserver(mutations => this.handleMutations(mutations))
        this.observer.observe(this.root, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeFilter: ['class', 'style', 'aria-label']
        })

        // Start polling
        this.sweep()
        this.pollTimer = setInterval(() => this.sweep(), this.pollInterval)

        // Watch for player re-rooting
        this.rerootTimer = setInterval(() => this.checkReroot(), this.rerootInterval)

        console.log('[detector] Started')
    }

    /**
     * Stop the detector
     */
    stop () {
        if (this.observer) {
            this.observer.disconnect()
            this.observer = null
        }
        if (this.pollTimer) {
            clearInterval(this.pollTimer)
            this.pollTimer = null
        }
        if (this.rerootTimer) {
            clearInterval(this.rerootTimer)
            this.rerootTimer = null
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = null
        }

        // Call subclass cleanup
        this.onStop?.()

        console.log('[detector] Stopped')
    }

    /**
     * Handle mutations from MutationObserver
     * @param {MutationRecord[]} mutations
     */
    handleMutations (mutations) {
        let hit = false

        for (const mutation of mutations) {
            // Handle text changes
            if (mutation.type === 'characterData' && mutation.target?.parentElement) {
                const parent = mutation.target.parentElement
                if (!this.seen.has(parent) && this.checkNode(parent)) {
                    this.seen.add(parent)
                    this.pendingNode = parent
                    hit = true
                }
            }

            // Handle added/changed nodes
            const candidates = [mutation.target, ...mutation.addedNodes].filter(Boolean)
            for (const node of candidates) {
                if (this.seen.has(node)) continue
                if (this.checkNode(node)) {
                    this.seen.add(node)
                    this.pendingNode = node
                    hit = true
                }
            }
        }

        if (hit) {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = setTimeout(() => {
                if (this.pendingNode) {
                    this.onDetection?.(this.pendingNode, 'mutation')
                    this.pendingNode = null
                }
            }, this.debounceDelay)
        }
    }

    /**
     * Periodic sweep to find nodes
     */
    sweep () {
        // Call subclass sweep implementation
        this.onSweep?.()

        // Use getNodesForSweep if provided by subclass
        const nodes = this.getNodesForSweep?.() || []
        for (const node of nodes) {
            if (!this.seen.has(node) && this.checkNode(node)) {
                this.seen.add(node)
                this.onDetection?.(node, 'poll')
                break // Only report once per sweep
            }
        }
    }

    /**
     * Check if player has changed and needs re-rooting
     */
    checkReroot () {
        const newRoot = getPlayerRoot()
        if (newRoot && newRoot !== this.root) {
            console.log('[detector] Player root changed, restarting...')
            this.stop()
            this.start()
        }
    }

    // ===== Methods to be implemented by subclasses =====

    /**
     * Check if a node matches detection criteria
     * @param {Node} node - The node to check
     * @returns {boolean} True if node matches detection criteria
     */
    checkNode (node) {
        throw new Error('checkNode() must be implemented by subclass')
    }

    /**
     * Optional: Called when detection occurs
     * @param {Node} node - The detected node
     * @param {string} source - Detection source ('mutation' or 'poll')
     */
    // onDetection(node, source) {}

    /**
     * Optional: Called when detector starts
     */
    // onStart() {}

    /**
     * Optional: Called when detector stops
     */
    // onStop() {}

    /**
     * Optional: Called during sweep to perform custom checks
     */
    // onSweep() {}

    /**
     * Optional: Return array of nodes to check during sweep
     * @returns {Node[]}
     */
    // getNodesForSweep() { return [] }
}
