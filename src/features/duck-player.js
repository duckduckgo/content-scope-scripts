/**
 * @module Duck Player Overlays
 *
 * @description
 *
 * Duck Player Overlays are either the small Dax icons that appear on top of video thumbnails
 * when browsing YouTube. These icons allow users to open the video in Duck Player.
 *
 * On the YouTube player page, the main Duck Player Overlay also allows users to open the video
 * in Duck Player, or dismiss the overlay.
 *
 * #### Messages:
 *
 * On Page Load
 *   - {@link DuckPlayerOverlayMessages.getUserValues} is initially called to get the current settings
 *   - {@link DuckPlayerOverlayMessages.onUserValuesChanged} subscription begins immediately - it will continue to listen for updates
 *
 * Then the following message can be sent at any time
 *   - {@link DuckPlayerOverlayMessages.setUserValues}
 *   - {@link DuckPlayerOverlayMessages.openDuckPlayer}
 *
 * Please see {@link DuckPlayerOverlayMessages} for the up-to-date list
 *
 * ## Remote Config
 *
 *   - Please see {@link OverlaysFeatureSettings} for docs on the individual fields
 *
 * All features are **off** by default. Remote config is then used to selectively enable features.
 *
 * For example, to enable the Duck Player Overlay on YouTube, the following config is used:
 *
 * ```json
 * [[include:integration-test/test-pages/duckplayer/config/overlays-live.json]]```
 *
 */
import ContentFeature from '../content-feature.js'

import { DuckPlayerOverlayMessages, OpenInDuckPlayerMsg, Pixel } from './duckplayer/overlay-messages.js'
import { isBeingFramed } from '../utils.js'
import { createMessaging } from '../create-messaging.js'
import { Environment, initOverlays } from './duckplayer/overlays.js'

/**
 * @typedef UserValues - A way to communicate user settings
 * @property {{enabled: {}} | {alwaysAsk:{}} | {disabled:{}}} privatePlayerMode - one of 3 values
 * @property {boolean} overlayInteracted - always a boolean
 */

/**
 * @internal
 */
export default class DuckPlayerFeature extends ContentFeature {
    /**
     * Lazily create a messaging instance for the given Platform + feature combo
     *
     * Note: This will be moved to 'ContentFeature' once we've ironed out all implementations
     * @return {import('@duckduckgo/messaging').Messaging}
     */
    get messaging () {
        if (this._messaging) return this._messaging
        if (typeof import.meta.injectName === 'undefined') throw new Error('import.meta.injectName missing')
        this._messaging = createMessaging(this, import.meta.injectName)
        return this._messaging
    }

    init (args) {
        /**
         * This feature never operates in a frame
         */
        if (isBeingFramed()) return

        /**
         * Just the 'overlays' part of the settings object.
         * @type {import("../types/duckplayer-settings.js").DuckPlayerSettings['overlays']}
         */
        const overlaySettings = this.getFeatureSetting('overlays')
        const overlaysEnabled = overlaySettings?.youtube?.state === 'enabled'

        /**
         * Serp proxy
         */
        const serpProxyEnabled = overlaySettings?.serpProxy?.state === 'enabled'

        /**
         * Bail if no features are enabled
         */
        if (!overlaysEnabled && !serpProxyEnabled) {
            return
        }

        /**
         * Bail if no messaging backend - this is a debugging feature to ensure we don't
         * accidentally enabled this
         */
        if (!this.messaging) {
            throw new Error('cannot operate duck player without a messaging backend')
        }

        const comms = new DuckPlayerOverlayMessages(this.messaging)
        const env = new Environment({
            debug: args.debug
        })

        if (overlaysEnabled) {
            initOverlays(overlaySettings.youtube, env, comms)
        } else if (serpProxyEnabled) {
            comms.serpProxy()
        }
    }

    load (args) {
        super.load(args)
    }
}

/**
 * @typedef {Omit<import("../types/duckplayer-settings").YouTubeOverlay, "state">} OverlaysFeatureSettings
 */

// for docs generation
export { DuckPlayerOverlayMessages, OpenInDuckPlayerMsg, Pixel }
