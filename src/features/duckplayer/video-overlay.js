/* eslint-disable promise/prefer-await-to-then */
/**
 * @module Duck Player Video Overlay
 *
 * @description
 *
 * ## Decision flow for appending the Video Overlays
 *
 * We'll try to append the full video overlay (or small Dax icon) onto the main video player
 * if the following conditions are met:
 *
 * 1. User has Duck Player configured to 'always ask' (the default)
 * 2. `videoOverlays` is enabled in the remote config
 *
 * If those are both met, the following steps occur on *first page load*:
 *
 * - let `href` be the current `window.location.href` value
 * - *exit to polling step* if `href` is not a valid watchPage
 * - when `href` is a valid watch page, then:
 *   - append CSS to the HEAD to avoid the main player showing
 *   - in a loop (every 100ms), continuously check if the video element has appeared
 * - when the video is showing:
 *   - if the user has duck player set to 'enabled', then:
 *     - show the small dax overlay
 * - if the user has duck player set to 'always ask', then:
 *   - if there's a one-time override (eg: from the serp), then exit to polling
 *   - if the user previously clicked 'watch here + remember', just add the small dax
 *   - otherwise, stop the video playing + append our overlay
 */
import { SideEffects, VideoParams } from './util.js'
import { DDGVideoOverlay } from './components/ddg-video-overlay.js'
import { OpenInDuckPlayerMsg, Pixel } from './overlay-messages.js'
import { IconOverlay } from './icon-overlay.js'

/**
 * Handle the switch between small & large overlays
 * + conduct any communications
 */
export class VideoOverlay {
    sideEffects = new SideEffects()

    /** @type {string | null} */
    lastVideoId = null

    /**
     * @param {object} options
     * @param {import("../duck-player.js").UserValues} options.userValues
     * @param {import("../duck-player.js").OverlaysFeatureSettings} options.settings
     * @param {import("./overlays.js").Environment} options.environment
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} options.messages
     * @param {import("../duck-player.js").UISettings} options.ui
     */
    constructor ({ userValues, settings, environment, messages, ui }) {
        this.userValues = userValues
        this.settings = settings
        this.environment = environment
        this.messages = messages
        this.ui = ui
    }

    /**
     * @param {'page-load' | 'preferences-changed' | 'href-changed'} trigger
     */
    init (trigger) {
        if (trigger === 'page-load') {
            this.handleFirstPageLoad()
        } else if (trigger === 'preferences-changed') {
            this.watchForVideoBeingAdded({ via: 'user notification', ignoreCache: true })
        } else if (trigger === 'href-changed') {
            this.watchForVideoBeingAdded({ via: 'href changed' })
        }
    }

    /**
     * Special handling of a first-page, an attempt to load our overlay as quickly as possible
     */
    handleFirstPageLoad () {
        // don't continue unless we're in 'alwaysAsk' mode
        if ('disabled' in this.userValues.privatePlayerMode) return

        // don't continue if we can't derive valid video params
        const validParams = VideoParams.forWatchPage(this.environment.getPlayerPageHref())
        if (!validParams) return

        /**
         * If we get here, we know the following:
         *
         * 1) we're going to show the overlay because of user settings/state
         * 2) we're on a valid `/watch` page
         * 3) we have at _least_ a valid video id
         *
         * So, in that case we append some css quickly to the head to ensure player items are not showing
         * Later, when our overlay loads that CSS will be removed in the cleanup.
         */
        this.sideEffects.add('add css to head', () => {
            const style = document.createElement('style')
            style.innerText = this.settings.selectors.videoElementContainer + ' { opacity: 0!important }'
            if (document.head) {
                document.head.appendChild(style)
            }
            return () => {
                if (style.isConnected) {
                    document.head.removeChild(style)
                }
            }
        })

        /**
         * Keep trying to find the video element every 100 ms
         */
        this.sideEffects.add('wait for first video element', () => {
            const int = setInterval(() => {
                this.watchForVideoBeingAdded({ via: 'first page load' })
            }, 100)
            return () => {
                clearInterval(int)
            }
        })
    }

    /**
     * @param {import("./util").VideoParams} params
     */
    addSmallDaxOverlay (params) {
        const containerElement = document.querySelector(this.settings.selectors.videoElementContainer)
        if (!containerElement || !(containerElement instanceof HTMLElement)) {
            console.error('no container element')
            return
        }
        this.sideEffects.add('adding small dax 🐥 icon overlay', () => {
            const href = params.toPrivatePlayerUrl()

            const icon = new IconOverlay()

            icon.appendSmallVideoOverlay(containerElement, href, (href) => {
                this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href }))
            })

            return () => {
                icon.destroy()
            }
        })
    }

    /**
     * @param {{ignoreCache?: boolean, via?: string}} [opts]
     */
    watchForVideoBeingAdded (opts = {}) {
        const params = VideoParams.forWatchPage(this.environment.getPlayerPageHref())

        if (!params) {
            /**
             * If we've shown a video before, but now we don't have a valid ID,
             * it's likely a 'back' navigation by the user, so we should always try to remove all overlays
             */
            if (this.lastVideoId) {
                this.destroy()
                this.lastVideoId = null
            }
            return
        }

        const conditions = [
            // cache overridden
            opts.ignoreCache,
            // first visit
            !this.lastVideoId,
            // new video id
            this.lastVideoId && this.lastVideoId !== params.id // different
        ]

        if (conditions.some(Boolean)) {
            /**
             * Don't continue until we've been able to find the HTML elements that we inject into
             */
            const videoElement = document.querySelector(this.settings.selectors.videoElement)
            const playerContainer = document.querySelector(this.settings.selectors.videoElementContainer)
            if (!videoElement || !playerContainer) {
                return null
            }

            /**
             * If we get here, it's a valid situation
             */
            const userValues = this.userValues
            this.lastVideoId = params.id

            /**
             * always remove everything first, to prevent any lingering state
             */
            this.destroy()

            /**
             * When enabled, just show the small dax icon
             */
            if ('enabled' in userValues.privatePlayerMode) {
                return this.addSmallDaxOverlay(params)
            }

            if ('alwaysAsk' in userValues.privatePlayerMode) {
                // if there's a one-time-override (eg: a link from the serp), then do nothing
                if (this.environment.hasOneTimeOverride()) return

                // if the user previously clicked 'watch here + remember', just add the small dax
                if (userValues.overlayInteracted) {
                    return this.addSmallDaxOverlay(params)
                }

                // if we get here, we're trying to prevent the video playing
                this.stopVideoFromPlaying()
                this.appendOverlayToPage(playerContainer, params)
            }
        }
    }

    /**
     * @param {Element} targetElement
     * @param {import("./util").VideoParams} params
     */
    appendOverlayToPage (targetElement, params) {
        this.sideEffects.add(`appending ${DDGVideoOverlay.CUSTOM_TAG_NAME} to the page`, () => {
            this.messages.sendPixel(new Pixel({ name: 'overlay' }))

            const { environment, ui } = this
            const overlayElement = new DDGVideoOverlay({
                environment,
                params,
                ui,
                manager: this
            })
            targetElement.appendChild(overlayElement)

            /**
             * To cleanup just find and remove the element
             */
            return () => {
                const prevOverlayElement = document.querySelector(DDGVideoOverlay.CUSTOM_TAG_NAME)
                prevOverlayElement?.remove()
            }
        })
    }

    /**
     * Just brute-force calling video.pause() for as long as the user is seeing the overlay.
     */
    stopVideoFromPlaying () {
        this.sideEffects.add(`pausing the <video> element with selector '${this.settings.selectors.videoElement}'`, () => {
            /**
             * Set up the interval - keep calling .pause() to prevent
             * the video from playing
             */
            const int = setInterval(() => {
                const video = /** @type {HTMLVideoElement} */(document.querySelector(this.settings.selectors.videoElement))
                if (video?.isConnected) {
                    video.pause()
                }
            }, 10)

            /**
             * To clean up, we need to stop the interval
             * and then call .play() on the original element, if it's still connected
             */
            return () => {
                clearInterval(int)

                const video = /** @type {HTMLVideoElement} */(document.querySelector(this.settings.selectors.videoElement))
                if (video?.isConnected) {
                    video.play()
                }
            }
        })
    }

    /**
     * If the checkbox was checked, this action means that we want to 'always'
     * use the private player
     *
     * But, if the checkbox was not checked, then we want to keep the state
     * as 'alwaysAsk'
     *
     * @param {boolean} remember
     * @param {VideoParams} params
     */
    userOptIn (remember, params) {
        /** @type {import("../duck-player.js").UserValues['privatePlayerMode']} */
        let privatePlayerMode = { alwaysAsk: {} }
        if (remember) {
            this.messages.sendPixel(new Pixel({ name: 'play.use', remember: '1' }))
            privatePlayerMode = { enabled: {} }
        } else {
            this.messages.sendPixel(new Pixel({ name: 'play.use', remember: '0' }))
            // do nothing. The checkbox was off meaning we don't want to save any choice
        }
        const outgoing = {
            overlayInteracted: false,
            privatePlayerMode
        }
        this.messages.setUserValues(outgoing)
            .then(() => {
                if (this.environment.opensVideoOverlayLinksViaMessage) {
                    return this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href: params.toPrivatePlayerUrl() }))
                }
                return this.environment.setHref(params.toPrivatePlayerUrl())
            })
            .catch(e => console.error('error setting user choice', e))
    }

    /**
     * @param {boolean} remember
     * @param {import("./util").VideoParams} params
     */
    userOptOut (remember, params) {
        /**
         * If the checkbox was checked we send the 'interacted' flag to the backend
         * so that the next video can just see the Dax icon instead of the full overlay
         *
         * But, if the checkbox was **not** checked, then we don't update any backend state
         * and instead we just swap the main overlay for Dax
         */
        if (remember) {
            this.messages.sendPixel(new Pixel({ name: 'play.do_not_use', remember: '1' }))
            /** @type {import("../duck-player.js").UserValues['privatePlayerMode']} */
            const privatePlayerMode = { alwaysAsk: {} }
            this.messages.setUserValues({
                privatePlayerMode,
                overlayInteracted: true
            })
                .then(values => {
                    this.userValues = values
                })
                .then(() => this.watchForVideoBeingAdded({ ignoreCache: true, via: 'userOptOut' }))
                .catch(e => console.error('could not set userChoice for opt-out', e))
        } else {
            this.messages.sendPixel(new Pixel({ name: 'play.do_not_use', remember: '0' }))
            this.destroy()
            this.addSmallDaxOverlay(params)
        }
    }

    /**
     * Remove elements, event listeners etc
     */
    destroy () {
        this.sideEffects.destroy()
    }
}
