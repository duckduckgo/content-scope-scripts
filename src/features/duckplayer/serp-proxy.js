import * as constants from './constants.js'

export class SerpProxy {
    /**
     * @param {import("./yt-overlays.js").Environment} environment
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} comms
     */
    constructor (environment, comms) {
        this.environment = environment
        this.comms = comms
    }

    init () {
        function respond (kind, data) {
            window.dispatchEvent(new CustomEvent(constants.MSG_NAME_PROXY_RESPONSE, {
                detail: { kind, data },
                composed: true,
                bubbles: true
            }))
        }

        // listen for setting and forward to the SERP window
        this.comms.onUserValuesChanged((values) => {
            respond(constants.MSG_NAME_PUSH_DATA, values)
        })

        // accept messages from the SERP and forward them to native
        window.addEventListener(constants.MSG_NAME_PROXY_INCOMING, (evt) => {
            try {
                assertCustomEvent(evt)
                if (evt.detail.kind === constants.MSG_NAME_SET_VALUES) {
                    this.comms.setUserValues(evt.detail.data)
                        // eslint-disable-next-line promise/prefer-await-to-then
                        .then(updated => respond(constants.MSG_NAME_PUSH_DATA, updated))
                        // eslint-disable-next-line promise/prefer-await-to-then
                        .catch(console.error)
                }
                if (evt.detail.kind === constants.MSG_NAME_READ_VALUES_SERP) {
                    this.comms.getUserValues()
                        // eslint-disable-next-line promise/prefer-await-to-then
                        .then(updated => respond(constants.MSG_NAME_PUSH_DATA, updated))
                        // eslint-disable-next-line promise/prefer-await-to-then
                        .catch(console.error)
                }
            } catch (e) {
                console.warn('cannot handle this message', e)
            }
        })
    }
}

/**
 * @param {any} event
 * @returns {asserts event is CustomEvent<{kind: string, data: any}>}
 */
function assertCustomEvent (event) {
    if (!('detail' in event)) throw new Error('none-custom event')
    if (typeof event.detail.kind !== 'string') throw new Error('custom event requires detail.kind to be a string')
}
