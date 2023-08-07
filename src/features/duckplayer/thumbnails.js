import { SideEffects, VideoParams } from './util.js'
import { IconOverlay } from './icon-overlay.js'
import { OpenInDuckPlayerMsg } from './overlay-messages.js'

/**
 * @typedef ThumbnailParams
 * @property {import("../duck-player.js").OverlaysFeatureSettings} settings
 * @property {import("./overlays.js").Environment} environment
 * @property {import("../duck-player.js").DuckPlayerOverlayMessages} messages
 */

/**
 * This features covers the implementation
 */
export class Thumbnails {
    sideEffects = new SideEffects()
    /**
     * @param {ThumbnailParams} params
     */
    constructor (params) {
        this.settings = params.settings
        this.messages = params.messages
        this.environment = params.environment
    }

    /**
     * Perform side effects
     */
    init () {
        this.sideEffects.add('showing overlays on hover', () => {
            const { selectors } = this.settings
            const parentNode = document.documentElement || document.body

            // create the icon & append it to the page
            const icon = new IconOverlay()
            icon.appendHoverOverlay((href) => {
                this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href }))
            })

            // remember when a none-dax click occurs - so that we can avoid re-adding the
            // icon whilst the page is navigating
            let clicked = false

            // detect all click, if it's anywhere on the page
            // but in the icon overlay itself, then just hide the overlay
            const clickHandler = (e) => {
                const overlay = icon.getHoverOverlay()
                if (overlay?.contains(e.target)) {
                    // do nothing here, the click will have been handled by the overlay
                } else if (overlay) {
                    clicked = true
                    icon.hideOverlay(overlay)
                    icon.hoverOverlayVisible = false
                    setTimeout(() => {
                        clicked = false
                    }, 0)
                }
            }

            parentNode.addEventListener('click', clickHandler, true)

            // detect hovers and decide to show hover icon, or not
            const mouseOverHandler = (e) => {
                if (clicked) return
                const hoverElement = findElementFromEvent(selectors.thumbLink, e)
                const validLink = isValidLink(hoverElement, this.settings)

                // if it's not an element we care about, bail early and remove the overlay
                if (!hoverElement || !validLink) {
                    const overlay = icon.getHoverOverlay()
                    if (overlay) {
                        icon.hideOverlay(overlay)
                        icon.hoverOverlayVisible = false
                    }
                    return
                }

                // also ensure it doesn't contain sub-links
                if (hoverElement.querySelector('a[href]')) {
                    return
                }

                // if we get here, we're confident that we can link to this video + it's a valid element to append to
                if (validLink) {
                    icon.moveHoverOverlayToVideoElement(hoverElement)
                }
            }

            parentNode.addEventListener('mouseover', mouseOverHandler, true)

            return () => {
                parentNode.removeEventListener('mouseover', mouseOverHandler, true)
                parentNode.removeEventListener('click', clickHandler, true)
                icon.destroy()
            }
        })
    }

    destroy () {
        this.sideEffects.destroy()
    }
}

export class ClickInterception {
    sideEffects = new SideEffects()
    /**
     * @param {ThumbnailParams} params
     */
    constructor (params) {
        this.settings = params.settings
        this.messages = params.messages
        this.environment = params.environment
    }

    /**
     * Perform side effects
     */
    init () {
        this.sideEffects.add('intercepting clicks', () => {
            const { selectors } = this.settings
            const parentNode = document.documentElement || document.body

            const clickHandler = (e) => {
                const clickedElement = findElementFromEvent(selectors.thumbLink, e)
                const validLink = isValidLink(clickedElement, this.settings)

                if (validLink) {
                    e.preventDefault()
                    e.stopPropagation()
                    this.messages.openDuckPlayer({ href: validLink })
                }
            }

            parentNode.addEventListener('click', clickHandler, true)

            return () => {
                parentNode.removeEventListener('click', clickHandler, true)
            }
        })
    }

    destroy () {
        this.sideEffects.destroy()
    }
}

/**
 * @param {string} selector
 * @param {MouseEvent} e
 * @return {HTMLElement|null}
 */
function findElementFromEvent (selector, e) {
    for (const element of document.elementsFromPoint(e.clientX, e.clientY)) {
        if (element.matches(selector)) return /** @type {HTMLElement} */(element)
    }
    return null
}

/**
 * @param {HTMLElement|null} element
 * @param settings
 * @return {string | null | undefined}
 */
function isValidLink (element, settings) {
    if (!element) return null

    /**
     * Does this element exist inside an excluded region?
     */
    const existsInExcludedParent = settings.selectors.excludedRegions.some(selector => {
        for (const parent of document.querySelectorAll(selector)) {
            if (parent.contains(element)) return true
        }
        return false
    })

    /**
     * Does this element exist inside an excluded region?
     * If so, bail
     */
    if (existsInExcludedParent) return null

    /**
     * We shouldn't be able to get here, but this keeps Typescript happy
     * and is a good check regardlesss
     */
    if (!('href' in element)) return null

    /**
     * If we get here, we're trying to convert the `element.href`
     * into a valid Duck Player URL
     */
    return VideoParams.fromHref(element.href)?.toPrivatePlayerUrl()
}
