/* global contentScopeFeatures */

const secret = window.crypto.randomUUID()

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
