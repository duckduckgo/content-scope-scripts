/* eslint-disable promise/prefer-await-to-then */
import { SideEffects, VideoParams } from './util.js'
import { DDGVideoOverlay } from './components/ddg-video-overlay.js'
import { OpenInDuckPlayerMsg, Pixel } from './overlay-messages.js'
import { IconOverlay } from './icon-overlay.js'

/**
 * Handle the switch between small & large overlays
 * + conduct any communications
 */
export class VideoOverlayManager {
    sideEffects = new SideEffects()

    /** @type {string | null} */
    lastVideoId = null

    /**
     * @param {import("../duck-player.js").UserValues} userValues
     * @param {import("../duck-player.js").OverlaysFeatureSettings} settings
     * @param {import("./overlays.js").Environment} environment
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} messages
     */
    constructor (userValues, settings, environment, messages) {
        this.userValues = userValues
        this.settings = settings
        this.environment = environment
        this.messages = messages
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
            style.innerText = '#player .html5-video-player { opacity: 0!important }'
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
    // @ts-expect-error - Not all code paths return a value.
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
             * When enabled, always show the small dax icon
             */
            if ('enabled' in userValues.privatePlayerMode) {
                this.addSmallDaxOverlay(params)
            }
            if ('alwaysAsk' in userValues.privatePlayerMode) {
                if (!userValues.overlayInteracted) {
                    if (!this.environment.hasOneTimeOverride()) {
                        this.stopVideoFromPlaying()
                        this.appendOverlayToPage(playerContainer, params)
                    }
                } else {
                    this.addSmallDaxOverlay(params)
                }
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

            const overlayElement = new DDGVideoOverlay(this.environment, params, this)
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
            .then(() => this.environment.setHref(params.toPrivatePlayerUrl()))
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
