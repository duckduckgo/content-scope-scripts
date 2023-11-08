/**
 * @module Web Share Shim
 *
 * @description
 *
 * This script defines a proxy for the Web Share API. It is only enabled on Android WebView.
 *
 */
import ContentFeature from '../content-feature'

const MSG_WEB_SHARE = 'web-share'

function canShare (data) {
    if (typeof data !== 'object') return false
    if ('files' in data) return false // Not supported at the moment
    if ('title' in data && typeof data.title !== 'string') return false
    if ('text' in data && typeof data.text !== 'string') return false
    if ('url' in data && typeof data.url !== 'string') return false
    return true
}

/**
 * Shim for WebShare API, only for Android WebView
 * @internal
 */
export default class WebShareShim extends ContentFeature {
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
            value: async (data) => {
                if (!canShare(data)) return Promise.reject(new TypeError('Invalid share data'))
                console.log('share', data)

                // TODO: check for transient activation and other things: https://w3c.github.io/web-share/#share-method
                const resp = await this.messaging.request(MSG_WEB_SHARE, data)
                console.log('resp', resp)
            }
        })
    }
}
