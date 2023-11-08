/**
 * @module Web Share Shim
 *
 * @description
 *
 * This script defines a proxy for the Web Share API. It is only enabled on Android WebView.
 *
 */
import ContentFeature from '../content-feature'
import { URL } from '../captured-globals'

const MSG_WEB_SHARE = 'web-share'

function canShare (data) {
    if (typeof data !== 'object') return false
    if ('files' in data) return false // Not supported at the moment
    if ('title' in data && typeof data.title !== 'string') return false
    if ('text' in data && typeof data.text !== 'string') return false
    if ('url' in data) {
        if (typeof data.url !== 'string') return false
        try {
            const url = new URL(data.url)
            if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
        } catch (err) {
            return false
        }
    }
    if (window !== window.top) return false // Not supported in iframes
    return true
}

/**
 * Shim for WebShare API, only for Android WebView
 * @internal
 */
export default class WebShareShim extends ContentFeature {
    /** @type {Promise<any> | null} */
    #activeShare = null

    init () {
        console.log('WebShareShim init')
        this.shimCanShare()
        this.shimShare()
    }

    shimCanShare () {
        if (typeof navigator.canShare === 'function') return
        this.defineProperty(Navigator.prototype, 'canShare', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: canShare
        })
    }

    shimShare () {
        if (typeof navigator.share === 'function') return
        this.defineProperty(Navigator.prototype, 'share', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: (data) => {
                if (!canShare(data)) return Promise.reject(new TypeError('Invalid share data'))
                if (this.#activeShare) {
                    return Promise.reject(new DOMException('Share already in progress', 'InvalidStateError'))
                }
                if (!navigator.userActivation.isActive) {
                    return Promise.reject(new DOMException('Share must be initiated by a user gesture', 'InvalidStateError'))
                }

                const dataToSend = structuredClone(data)
                if ('url' in data) dataToSend.url = new URL(data.url)

                // eslint-disable-next-line promise/prefer-await-to-then
                this.#activeShare = this.messaging.request(MSG_WEB_SHARE, dataToSend).then(
                    resp => {
                        console.log('resp', resp)
                        this.#activeShare = null
                        if (resp.error) {
                            switch (resp.error.name) {
                            case 'AbortError':
                            case 'NotAllowedError':
                            case 'DataError':
                                throw new DOMException(resp.error.message, resp.error.name)
                            default:
                                throw new DOMException(resp.error.message, 'DataError')
                            }
                        }
                    },
                    err => {
                        console.error('share error', err)
                        this.#activeShare = null
                        throw new DOMException(err.message, 'DataError')
                    })
                return this.#activeShare
            }
        })
    }
}
