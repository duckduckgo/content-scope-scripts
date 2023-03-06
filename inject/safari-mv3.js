/* global contentScopeFeatures */

// Trackers are not needed on Safari as we're not using our own cookie protections.
// import { isTrackerOrigin } from '../src/trackers'

const secret = (crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32).toString().replace('0.', '')

contentScopeFeatures.load({
    platform: {
        name: 'extension'
    },
    // documentOriginIsTracker: isTrackerOrigin($TRACKER_LOOKUP$),
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    bundledConfig: $BUNDLED_CONFIG$
})

// Safari has no guarentees over script loading order, so our event may not be seen by
// content-scope-messaging. As a work around we send messages every 10ms until we get
// a response.
const secretDispatchInterval = setInterval(() => {
    window.dispatchEvent(new CustomEvent('ddg-secret', {
        detail: secret
    }))
}, 10)

// @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
window.addEventListener(secret, ({ detail: message }) => {
    clearInterval(secretDispatchInterval)
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

// if content-scope-messaging doesn't respond in 5s, stop sending events
setTimeout(() => {
    clearInterval(secretDispatchInterval)
}, 5000)
