/**
 * @module Chrome MV3 integration
 */
/* global contentScopeFeatures */

import { isTrackerOrigin } from '../src/trackers'

const secret = (crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32).toString().replace('0.', '')

contentScopeFeatures.load({
    platform: {
        name: 'extension'
    },
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    documentOriginIsTracker: isTrackerOrigin($TRACKER_LOOKUP$),
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    bundledConfig: $BUNDLED_CONFIG$
})

// @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
window.addEventListener(secret, ({ detail: message }) => {
    if (!message) return

    switch (message.type) {
    case 'update':
        contentScopeFeatures.update(message)
        break
    case 'register':
        if (message.argumentsObject) {
            message.argumentsObject.messageSecret = secret
            contentScopeFeatures.init(message.argumentsObject)
        }
        break
    }
})

window.dispatchEvent(new CustomEvent('ddg-secret', {
    detail: secret
}))
