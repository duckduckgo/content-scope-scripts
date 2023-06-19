import { VideoOverlayManager } from './video-overlay-manager.js'
import { AllIconOverlays } from './icon-overlay.js'
import { registerCustomElements } from './components/index.js'
import { OpenInDuckPlayer } from './open-in-duckplayer.js'
import { DomState } from './util.js'

/**
 * @param {Environment} environment - methods to read environment-sensitive things like the current URL etc
 * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} comms - methods to communicate with a native backend
 */
export class YTOverlays {
    constructor (environment, comms) {
        this.environment = environment
        this.comms = comms
        /**
         * If we get here it's safe to register our custom elements
         */
        registerCustomElements()
    }

    async init () {
        /**
         * Entry point. Until this returns with initial user values, we cannot continue.
         */
        let userValues
        try {
            userValues = await this.comms.getUserValues()
        } catch (e) {
            console.error(e)
            return
        }

        const domState = new DomState()

        const videoPlayerOverlay = new VideoOverlayManager(userValues, this.environment, this.comms)
        videoPlayerOverlay.handleFirstPageLoad()

        const iconOverlays = new AllIconOverlays(this.environment, domState, videoPlayerOverlay, this.comms)
        const openInDuckPlayer = new OpenInDuckPlayer(this.comms, domState)

        this.comms.onUserValuesChanged((userValues) => {
            videoPlayerOverlay.userValues = userValues
            videoPlayerOverlay.watchForVideoBeingAdded({ via: 'user notification', ignoreCache: true })

            if ('disabled' in userValues.privatePlayerMode) {
                iconOverlays.disable()
                openInDuckPlayer.disable()
            } else if ('enabled' in userValues.privatePlayerMode) {
                iconOverlays.disable()
                openInDuckPlayer.enable()
            } else if ('alwaysAsk' in userValues.privatePlayerMode) {
                iconOverlays.enable()
                openInDuckPlayer.disable()
            }
        } /* userValues */)

        // Enable icon overlays on page load if not explicitly disabled
        if ('alwaysAsk' in userValues.privatePlayerMode) {
            iconOverlays.start()
        } else if ('enabled' in userValues.privatePlayerMode) {
            openInDuckPlayer.enableOnDOMLoaded()
        }
    }
}

export class Environment {
    allowedOverlayOrigins = ['www.youtube.com', 'duckduckgo.com']
    allowedProxyOrigins = ['duckduckgo.com']

    /**
     * @param {object} params
     * @param {boolean|null|undefined} [params.debug]
     */
    constructor (params) {
        this.debug = Boolean(params.debug)
    }

    getPlayerPageHref () {
        if (this.debug) {
            return 'https://youtube.com/watch?v=123'
        }
        return window.location.href
    }

    getLargeThumbnailSrc (videoId) {
        const url = new URL(`/vi/${videoId}/maxresdefault.jpg`, 'https://i.ytimg.com')
        return url.href
    }

    setHref (href) {
        window.location.href = href
    }

    hasOneTimeOverride () {
        try {
            // #ddg-play is a hard requirement, regardless of referrer
            if (window.location.hash !== '#ddg-play') return false

            // double-check that we have something that might be a parseable URL
            if (typeof document.referrer !== 'string') return false
            if (document.referrer.length === 0) return false // can be empty!

            const { hostname } = new URL(document.referrer)
            const isAllowed = this.allowedProxyOrigins.includes(hostname)
            return isAllowed
        } catch (e) {
            console.error(e)
        }
        return false
    }

    isTestMode () {
        return this.debug === true
    }
}
