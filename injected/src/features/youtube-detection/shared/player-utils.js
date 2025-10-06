/**
 * @module YouTube Player Utilities
 * @description Shared utilities for finding and interacting with YouTube player elements
 */

/**
 * Common selectors for YouTube player root elements
 */
export const PLAYER_SELECTORS = ['#movie_player', '.html5-video-player', '#player']

/**
 * Find the YouTube player root element
 * @returns {HTMLElement|null} The player root element or null if not found
 */
export function getPlayerRoot () {
    for (const selector of PLAYER_SELECTORS) {
        const element = document.querySelector(selector)
        if (element) return element
    }
    return null
}

/**
 * Check if an element is visible (has dimensions, not hidden, has opacity)
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} True if element is visible
 */
export function isVisible (element) {
    const computedStyle = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return (
        rect.width > 0.5 &&
        rect.height > 0.5 &&
        computedStyle.display !== 'none' &&
        computedStyle.visibility !== 'hidden' &&
        +computedStyle.opacity > 0.05
    )
}

/**
 * Extract the video ID from the current URL
 * @returns {string|null} The video ID or null if not found
 */
export function getVideoId () {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('v')
}

/**
 * Find the video element within a player root
 * @param {HTMLElement} root - The player root element
 * @returns {HTMLVideoElement|null} The video element or null if not found
 */
export function getVideoElement (root) {
    return root?.querySelector('video') || null
}
