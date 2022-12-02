/* global contentScopeFeatures */

const secret = (crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32).toString().replace('0.', '')

contentScopeFeatures.load({
    platform: {
        name: 'extension'
    }
})

window.addEventListener(secret, ({ detail: message }) => {
    if (!message) return

    switch (message.type) {
    case 'update':
        contentScopeFeatures.update(message)
        break
    case 'register':
        if (message.argumentsObject) {
            contentScopeFeatures.init(message.argumentsObject)
        }
        break
    }
})

window.dispatchEvent(new CustomEvent('ddg-secret', {
    detail: secret
}))
