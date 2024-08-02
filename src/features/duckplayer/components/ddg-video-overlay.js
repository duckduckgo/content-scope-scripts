import css from '../assets/video-overlay.css'
import mobilecss from '../assets/mobile-video-overlay.css'
import dax from '../assets/dax.svg'
import info from '../assets/info.svg'
import arrow from '../assets/arrow.svg'
import { overlayCopyVariants } from '../text.js'
import { appendImageAsBackground } from '../util.js'
import { VideoOverlay } from '../video-overlay.js'
import { html, trustedUnsafe } from '../../../dom-utils.js'

/**
 * The custom element that we use to present our UI elements
 * over the YouTube player
 */
export class DDGVideoOverlay extends HTMLElement {
    static CUSTOM_TAG_NAME = 'ddg-video-overlay'
    /**
     * @param {object} options
     * @param {import("../overlays.js").Environment} options.environment
     * @param {import("../util").VideoParams} options.params
     * @param {import("../../duck-player.js").UISettings} options.ui
     * @param {'mobile' | 'desktop'} [options.layout]
     * @param {VideoOverlay} options.manager
     */
    constructor ({ environment, params, ui, manager, layout = 'desktop' }) {
        super()
        if (!(manager instanceof VideoOverlay)) throw new Error('invalid arguments')
        this.environment = environment
        this.ui = ui
        this.params = params
        this.manager = manager
        this.layout = layout

        /**
         * Create the shadow root, closed to prevent any outside observers
         * @type {ShadowRoot}
         */
        const shadow = this.attachShadow({ mode: this.environment.isTestMode() ? 'open' : 'closed' })

        /**
         * Add our styles
         * @type {HTMLStyleElement}
         */
        const style = document.createElement('style')
        style.innerText = this.layout === 'desktop' ? css : mobilecss

        /**
         * Create the overlay
         * @type {HTMLDivElement}
         */
        const overlay = this.createOverlay()

        /**
         * Append both to the shadow root
         */
        shadow.appendChild(overlay)
        shadow.appendChild(style)
    }

    /**
     * @returns {HTMLDivElement}
     */
    createOverlay () {
        // select copy based on layout
        const overlayCopy = this.layout === 'desktop'
            ? overlayCopyVariants[this.ui?.overlayCopy || 'default']
            : overlayCopyVariants.a1

        const overlayElement = document.createElement('div')
        overlayElement.classList.add('ddg-video-player-overlay')

        const content = this.layout === 'desktop'
            ? this.desktopHtml(overlayCopy)
            : this.mobileHtml(overlayCopy)

        // append markup based on layout
        overlayElement.innerHTML = trusted(content)

        /**
         * Set the link
         * @type {string}
         */
        const href = this.params.toPrivatePlayerUrl()
        overlayElement.querySelector('.ddg-vpo-open')?.setAttribute('href', href)

        /**
         * Add thumbnail
         */
        if (this.layout === 'desktop') {
            this.appendThumbnail(overlayElement, this.params.id)
        }

        /**
         * Setup the click handlers
         */
        this.setupButtonsInsideOverlay(overlayElement, this.params)

        return overlayElement
    }

    /**
     * @returns {string}
     */
    desktopHtml (overlayCopy) {
        const svgIcon = trustedUnsafe(dax)
        return html`
            <div class="ddg-vpo-bg"></div>
            <div class="ddg-vpo-content">
                <div class="ddg-eyeball">${svgIcon}</div>
                <div class="ddg-vpo-title">${overlayCopy.title}</div>
                <div class="ddg-vpo-text">
                    ${overlayCopy.subtitle}
                </div>
                <div class="ddg-vpo-buttons">
                    <button class="ddg-vpo-button ddg-vpo-cancel" type="button">${overlayCopy.buttonOptOut}</button>
                    <a class="ddg-vpo-button ddg-vpo-open" href="#">${overlayCopy.buttonOpen}</a>
                </div>
                <div class="ddg-vpo-remember">
                    <label for="remember">
                        <input id="remember" type="checkbox" name="ddg-remember"> ${overlayCopy.rememberLabel}
                    </label>
                </div>
            </div>
            `.toString()
    }

    /**
     * @param {overlayCopyVariants[keyof overlayCopyVariants]} overlayCopy
     * @returns {string}
     */
    mobileHtml (overlayCopy) {
        const svgIcon = trustedUnsafe(dax)
        const infoIcon = trustedUnsafe(info)
        const arrowSvg = trustedUnsafe(arrow)
        return html`
            <div class="bg ddg-vpo-bg"></div>
            <div class="content ios">
                <div class="logo">${svgIcon}</div>
                <div class="callout">
                    <span class="arrow">
                        ${arrowSvg}
                    </span>
                    <div class="title">${overlayCopy.title}</div>
                    <div class="text">
                        ${overlayCopy.subtitle}
                    </div>
                    <div class="buttons">
                        <button class="button cancel ddg-vpo-cancel" type="button">${overlayCopy.buttonOptOut}</button>
                        <a class="button open ddg-vpo-open" href="#">${overlayCopy.buttonOpen}</a>
                    </div>
                    <div class="remember">
                        <div class="remember-label">
                            <span class="remember-text">
                                ${overlayCopy.rememberLabel} 
                            </span>
                            <span class="remember-checkbox">
                                <input id="remember" type="checkbox" name="ddg-remember" hidden> 
                                <button role="switch" aria-checked="false" class="switch ios-switch">
                                    <span class="thumb"></span>
                                </button>
                            </span>
                        </div>
                        <button class="button info">
                            ${infoIcon}
                        </button>
                    </div>
                </div>
            </div>
            `.toString()
    }

    /**
     * @param {HTMLElement} overlayElement
     * @param {string} videoId
     */
    appendThumbnail (overlayElement, videoId) {
        const imageUrl = this.environment.getLargeThumbnailSrc(videoId)
        appendImageAsBackground(overlayElement, '.ddg-vpo-bg', imageUrl)
    }

    /**
     * @param {HTMLElement} containerElement
     * @param {import("../util").VideoParams} params
     */
    setupButtonsInsideOverlay (containerElement, params) {
        const switchElem = containerElement.querySelector('[role=switch]')
        const remember = containerElement.querySelector('input[name="ddg-remember"]')
        if (switchElem && remember && remember instanceof HTMLInputElement) {
            switchElem.addEventListener('click', () => {
                const current = switchElem.getAttribute('aria-checked')
                if (current === 'false') {
                    switchElem.setAttribute('aria-checked', 'true')
                    remember.checked = true
                } else {
                    switchElem.setAttribute('aria-checked', 'false')
                    remember.checked = false
                }
            })
        }
        const cancelElement = containerElement.querySelector('.ddg-vpo-cancel')
        const watchInPlayer = containerElement.querySelector('.ddg-vpo-open')
        if (!cancelElement) return console.warn('Could not access .ddg-vpo-cancel')
        if (!watchInPlayer) return console.warn('Could not access .ddg-vpo-open')
        const optOutHandler = (e) => {
            if (e.isTrusted) {
                const remember = containerElement.querySelector('input[name="ddg-remember"]')
                if (!(remember instanceof HTMLInputElement)) throw new Error('cannot find our input')
                this.manager.userOptOut(remember.checked, params)
            }
        }
        const watchInPlayerHandler = (e) => {
            if (e.isTrusted) {
                e.preventDefault()
                const remember = containerElement.querySelector('input[name="ddg-remember"]')
                if (!(remember instanceof HTMLInputElement)) throw new Error('cannot find our input')
                this.manager.userOptIn(remember.checked, params)
            }
        }
        cancelElement.addEventListener('click', optOutHandler)
        watchInPlayer.addEventListener('click', watchInPlayerHandler)
    }
}

function trusted (string) {
    if ('trustedTypes' in globalThis) {
        const policy = globalThis.trustedTypes.createPolicy('default', {
            createHTML: (s) => s
        })
        return policy.createHTML(string)
    }
    return string
}
