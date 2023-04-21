/**
 * @module Duck Player Overlays
 *
 * @description
 *
 * Overlays will currently only show on YouTube.com
 */
import ContentFeature from '../content-feature.js'

import { DuckPlayerOverlayMessages, OpenInDuckPlayerMsg, Pixel } from './duckplayer/overlay-messages.js'
import { Messaging, MessagingContext, WindowsMessagingConfig } from '@duckduckgo/messaging'
import { Environment, initOverlays } from './duckplayer/overlays.js'

/**
 * @internal
 */
export default class DuckPlayerFeature extends ContentFeature {
    /**
     * Lazily create a messaging instance for the given Platform + feature combo
     * @return {Messaging}
     */
    get messaging () {
        if (this._messaging) return this._messaging
        if (this.platform.name === 'windows') {
            const context = new MessagingContext({
                context: 'contentScopeScripts',
                env: this._args.debug ? 'development' : 'production',
                featureName: this.name
            })
            const config = new WindowsMessagingConfig({
                methods: {
                    // @ts-expect-error - Type 'unknown' is not assignable to type...
                    postMessage: windowsInteropPostMessage,
                    // @ts-expect-error - Type 'unknown' is not assignable to type...
                    addEventListener: windowsInteropAddEventListener,
                    // @ts-expect-error - Type 'unknown' is not assignable to type...
                    removeEventListener: windowsInteropRemoveEventListener
                }
            })
            this._messaging = new Messaging(context, config)
            return this._messaging
        }
        throw new Error('Messaging not supported yet on platform: ' + this.name)
    }

    init (args) {
        if (!this.messaging) {
            throw new Error('cannot operate duck player without a messaging backend')
        }
        const comms = new DuckPlayerOverlayMessages(this.messaging)
        const env = new Environment({
            debug: args.debug
        })

        /**
         * Overlays
         */
        const overlaySettings = this.getFeatureSetting('overlays')
        const overlaysEnabled = overlaySettings.youtube.state === 'enabled'

        if (overlaysEnabled) {
            initOverlays(env, comms)
        }
    }

    load (args) {
        super.load(args)
    }
}

// for docs generation
export { DuckPlayerOverlayMessages, OpenInDuckPlayerMsg, Pixel }
