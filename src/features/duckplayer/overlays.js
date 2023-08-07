import { DomState } from './util.js'
import { ClickInterception, Thumbnails } from './thumbnails.js'
import { VideoOverlayManager } from './video-overlay-manager.js'
import { registerCustomElements } from './components/index.js'

/**
 * @param {import("../duck-player.js").OverlaysFeatureSettings} settings - methods to read environment-sensitive things like the current URL etc
 * @param {import("./overlays.js").Environment} environment - methods to read environment-sensitive things like the current URL etc
 * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} messages - methods to communicate with a native backend
 */
export async function initOverlays (settings, environment, messages) {
    // bind early to attach all listeners
    const domState = new DomState()

    /** @type {import("../duck-player.js").UserValues} */
    let userValues
    try {
        userValues = await messages.getUserValues()
    } catch (e) {
        console.error(e)
        return
    }

    if (!userValues) {
        console.error('cannot continue without user settings')
        return
    }

    /**
     * Create the instance - this might fail if settings or user preferences prevent it
     * @type {Thumbnails|undefined}
     */
    let thumbnails = thumbnailsFeatureFromSettings(userValues, settings, messages, environment)
    let videoOverlays = videoOverlaysFeatureFromSettings(userValues, settings, messages, environment)

    if (thumbnails || videoOverlays) {
        if (videoOverlays) {
            registerCustomElements()
            videoOverlays?.init('page-load')
        }
        domState.onLoaded(() => {
            // start initially
            thumbnails?.init()

            // now add video overlay specific stuff
            if (videoOverlays) {
                // there was an issue capturing history.pushState, so just falling back to
                let prev = globalThis.location.href
                setInterval(() => {
                    if (globalThis.location.href !== prev) {
                        videoOverlays?.init('href-changed')
                    }
                    prev = globalThis.location.href
                }, 500)
            }
        })
    }

    function update () {
        thumbnails?.destroy()
        videoOverlays?.destroy()

        // re-create thumbs
        thumbnails = thumbnailsFeatureFromSettings(userValues, settings, messages, environment)
        thumbnails?.init()

        // re-create video overlay
        videoOverlays = videoOverlaysFeatureFromSettings(userValues, settings, messages, environment)
        videoOverlays?.init('preferences-changed')
    }

    /**
     * Continue to listen for updated preferences and try to re-initiate
     */
    messages.onUserValuesChanged(_userValues => {
        userValues = _userValues
        update()
    })
}

/**
 * @param {import("../duck-player.js").UserValues} userPreferences
 * @param {import("../duck-player.js").OverlaysFeatureSettings} settings
 * @param {import("../duck-player.js").DuckPlayerOverlayMessages} messages
 * @param {Environment} environment
 * @returns {Thumbnails | ClickInterception | undefined}
 */
function thumbnailsFeatureFromSettings (userPreferences, settings, messages, environment) {
    const showThumbs = 'alwaysAsk' in userPreferences.privatePlayerMode && settings.thumbnailOverlays.state === 'enabled'
    const interceptClicks = 'enabled' in userPreferences.privatePlayerMode && settings.clickInterception.state === 'enabled'

    if (showThumbs) {
        return new Thumbnails({
            environment,
            settings,
            messages
        })
    }
    if (interceptClicks) {
        return new ClickInterception({
            environment,
            settings,
            messages
        })
    }

    return undefined
}

/**
 * @param {import("../duck-player.js").UserValues} userValues
 * @param {import("../duck-player.js").OverlaysFeatureSettings} settings
 * @param {import("../duck-player.js").DuckPlayerOverlayMessages} messages
 * @param {import("./overlays.js").Environment} environment
 * @returns {VideoOverlayManager | undefined}
 */
function videoOverlaysFeatureFromSettings (userValues, settings, messages, environment) {
    if (settings.videoOverlays.state !== 'enabled') return undefined

    return new VideoOverlayManager(userValues, settings, environment, messages)
}

export class Environment {
    allowedProxyOrigins = ['duckduckgo.com']

    /**
     * @param {object} params
     * @param {boolean|null|undefined} [params.debug]
     */
    constructor (params) {
        this.debug = Boolean(params.debug)
    }

    /**
     * This is the URL of the page that the user is currently on
     * It's abstracted so that we can mock it in tests
     * @return {string}
     */
    getPlayerPageHref () {
        if (this.debug) {
            const url = new URL(window.location.href)
            if (url.hostname === 'www.youtube.com') return window.location.href

            // reflect certain query params, this is useful for testing
            if (url.searchParams.has('v')) {
                const base = new URL('/watch', 'https://youtube.com')
                base.searchParams.set('v', url.searchParams.get('v') || '')
                return base.toString()
            }

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
