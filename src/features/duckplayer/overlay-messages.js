/* eslint-disable promise/prefer-await-to-then */
import * as constants from './constants.js'

/**
 * @typedef {import("@duckduckgo/messaging").Messaging} Messaging
 *
 * A wrapper for all communications.
 *
 * Please see https://duckduckgo.github.io/content-scope-utils/modules/Webkit_Messaging for the underlying
 * messaging primitives.
 */
export class DuckPlayerOverlayMessages {
    /**
     * @param {Messaging} messaging
     * @internal
     */
    constructor (messaging) {
        /**
         * @internal
         */
        this.messaging = messaging
    }

    /**
     * Inform the native layer that an interaction occurred
     * @param {import("../duck-player.js").UserValues} userValues
     * @returns {Promise<import("../duck-player.js").UserValues>}
     */
    setUserValues (userValues) {
        return this.messaging.request(constants.MSG_NAME_SET_VALUES, userValues)
    }

    /**
     * @returns {Promise<import("../duck-player.js").UserValues>}
     */
    getUserValues () {
        return this.messaging.request(constants.MSG_NAME_READ_VALUES, {})
    }

    /**
     * @param {Pixel} pixel
     */
    sendPixel (pixel) {
        this.messaging.notify(constants.MSG_NAME_PIXEL, {
            pixelName: pixel.name(),
            params: pixel.params()
        })
    }

    /**
     * This is sent when the user wants to open Duck Player.
     * See {@link OpenInDuckPlayerMsg} for params
     * @param {OpenInDuckPlayerMsg} params
     */
    openDuckPlayer (params) {
        return this.messaging.notify(constants.MSG_NAME_OPEN_PLAYER, params)
    }

    /**
     * Get notification when preferences/state changed
     * @param {(userValues: import("../duck-player.js").UserValues) => void} cb
     */
    onUserValuesChanged (cb) {
        return this.messaging.subscribe('onUserValuesChanged', cb)
    }
}

export class Pixel {
    /**
     * A list of known pixels
     * @param {{name: "overlay"} | {name: "play.use", remember: "0" | "1"} | {name: "play.do_not_use", remember: "0" | "1"}} input
     */
    constructor (input) {
        this.input = input
    }

    name () {
        return this.input.name
    }

    params () {
        switch (this.input.name) {
        case 'overlay': return {}
        case 'play.use':
        case 'play.do_not_use': {
            return { remember: this.input.remember }
        }
        default: throw new Error('unreachable')
        }
    }
}

export class OpenInDuckPlayerMsg {
    /**
     * @param {object} params
     * @param {string} params.href
     */
    constructor (params) {
        this.href = params.href
    }
}
