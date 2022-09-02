export function mainWorld (argumentsObject) {
    /* global contentScopeFeatures */

    contentScopeFeatures.load()

    // Should not be possible, since this function should not be injected if
    // disabled.
    if (!argumentsObject) return

    if (argumentsObject.debug) {
        window.addEventListener('message', (m) => {
            if (m.data.action && m.data.message) {
                chrome.runtime.sendMessage({
                    messageType: 'debuggerMessage',
                    options: m.data
                })
            }
        })
    }

    contentScopeFeatures.init(argumentsObject)

    window.addEventListener(argumentsObject.sessionKey, ({ detail: message }) => {
        if (message?.type === 'update') {
            contentScopeFeatures.update(message)
        }
    })
}

export function isolatedWorld (argumentsObject) {
    chrome.runtime.onMessage.addListener((message) => {
        window.dispatchEvent(new CustomEvent(argumentsObject.sessionKey, {
            detail: message
        }))
    })
}
