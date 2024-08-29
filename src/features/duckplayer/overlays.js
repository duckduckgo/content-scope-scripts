import { DomState } from './util.js'
import { ClickInterception, Thumbnails } from './thumbnails.js'
import { VideoOverlay } from './video-overlay.js'
import { registerCustomElements } from './components/index.js'

/**
 * @param {import("../duck-player.js").OverlaysFeatureSettings} settings - methods to read environment-sensitive things like the current URL etc
 * @param {import("./overlays.js").Environment} environment - methods to read environment-sensitive things like the current URL etc
 * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} messages - methods to communicate with a native backend
 */
export async function initOverlays (settings, environment, messages) {
    // bind early to attach all listeners
    const domState = new DomState()

    /** @type {import("../duck-player.js").OverlaysInitialSettings} */
    let initialSetup
    try {
        initialSetup = await messages.initialSetup()
    } catch (e) {
        console.error(e)
        return
    }

    if (!initialSetup) {
        console.error('cannot continue without user settings')
        return
    }

    let { userValues, ui } = initialSetup

    /**
     * Create the instance - this might fail if settings or user preferences prevent it
     * @type {Thumbnails|ClickInterception|null}
     */
    let thumbnails = thumbnailsFeatureFromOptions({ userValues, settings, messages, environment, ui })
    let videoOverlays = videoOverlaysFeatureFromSettings({ userValues, settings, messages, environment, ui })

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
        thumbnails = thumbnailsFeatureFromOptions({ userValues, settings, messages, environment, ui })
        thumbnails?.init()

        // re-create video overlay
        videoOverlays = videoOverlaysFeatureFromSettings({ userValues, settings, messages, environment, ui })
        videoOverlays?.init('preferences-changed')
    }

    /**
     * Continue to listen for updated preferences and try to re-initiate
     */
    messages.onUserValuesChanged(_userValues => {
        userValues = _userValues
        update()
    })

    /**
     * Continue to listen for updated UI settings and try to re-initiate
     */
    messages.onUIValuesChanged(_ui => {
        ui = _ui
        update()
    })
}

/**
 * @param {object} options
 * @param {import("../duck-player.js").UserValues} options.userValues
 * @param {import("../duck-player.js").OverlaysFeatureSettings} options.settings
 * @param {import("../duck-player.js").DuckPlayerOverlayMessages} options.messages
 * @param {import("../duck-player.js").UISettings} options.ui
 * @param {Environment} options.environment
 * @returns {Thumbnails | ClickInterception | null}
 */
function thumbnailsFeatureFromOptions (options) {
    return thumbnailOverlays(options) || clickInterceptions(options)
}

/**
 * @param userValues
 * @param settings
 * @param messages
 * @param environment
 * @param ui
 * @return {Thumbnails | null}
 */
function thumbnailOverlays({ userValues, settings, messages, environment, ui }) {

    const conditions = [
        // must be enabled remotely
        settings.thumbnailOverlays.state === 'enabled',
        // must be in 'always ask' mode
        'alwaysAsk' in userValues.privatePlayerMode,
        // must not be set yo place in DuckPlayer
        ui?.playInDuckPlayer !== true
    ];

    if (!conditions.every(Boolean)) return null

    return new Thumbnails({
        environment,
        settings,
        messages
    })
}

/**
 * @param userValues
 * @param settings
 * @param messages
 * @param environment
 * @param ui
 * @return {ClickInterception | null}
 */
function clickInterceptions({ userValues, settings, messages, environment, ui }) {
    // bail if not enabled remotely
    if (settings.clickInterception.state !== 'enabled') return null

    const options = [
        // either enabled via prefs
        'enabled' in userValues.privatePlayerMode,
        // or has a one-time override
        ui?.playInDuckPlayer === true
    ];

    if (!options.some(Boolean)) return null

    return new ClickInterception({
        environment,
        settings,
        messages
    })
}

/**
 * @param {object} options
 * @param {import("../duck-player.js").UserValues} options.userValues
 * @param {import("../duck-player.js").OverlaysFeatureSettings} options.settings
 * @param {import("../duck-player.js").DuckPlayerOverlayMessages} options.messages
 * @param {import("./overlays.js").Environment} options.environment
 * @param {import("../duck-player.js").UISettings} options.ui
 * @returns {VideoOverlay | undefined}
 */
function videoOverlaysFeatureFromSettings ({ userValues, settings, messages, environment, ui }) {
    if (settings.videoOverlays.state !== 'enabled') return undefined

    return new VideoOverlay({ userValues, settings, environment, messages, ui })
}

export class Environment {
    allowedProxyOrigins = ['duckduckgo.com']

    /**
     * @param {object} params
     * @param {{name: string}} params.platform
     * @param {boolean|null|undefined} [params.debug]
     * @param {ImportMeta['injectName']} params.injectName
     */
    constructor (params) {
        this.debug = Boolean(params.debug)
        this.injectName = params.injectName
        this.platform = params.platform
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

    /**
     * @returns {import("../duck-player.js").UISettings['overlayCopy'] | null}
     */
    getOverlayCopyOverride () {
        if (this.isIntegrationMode()) {
            const allowedOverlayCopyOverrides = ['default', 'a1', 'b1']

            const url = new URLSearchParams(window.location.href)
            const override = url.get('overlayCopy')
            if (override && allowedOverlayCopyOverrides.includes(override)) {
                return /** @type {import("../duck-player.js").UISettings['overlayCopy']} */ (override)
            }
        }
        return null
    }

    isIntegrationMode () {
        return this.debug === true && this.injectName === 'integration'
    }

    isTestMode () {
        return this.debug === true
    }

    get opensVideoOverlayLinksViaMessage () {
        return this.platform.name !== 'windows'
    }
}
