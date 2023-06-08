import { Messaging, MessagingContext, WebkitMessagingConfig, WindowsMessagingConfig } from '@duckduckgo/messaging'

/**
 * Extracted so we can iterate on the best way to bring this to all platforms
 * @param {import('./content-feature.js').default} feature
 * @param {string} injectName
 * @return {Messaging}
 */
export function createMessaging (feature, injectName) {
    const contextName = injectName === 'apple-isolated'
        ? 'contentScopeScriptsIsolated'
        : 'contentScopeScripts'

    const context = new MessagingContext({
        context: contextName,
        env: feature.isDebug ? 'development' : 'production',
        featureName: feature.name
    })

    const config = {
        windows: () => {
            return new WindowsMessagingConfig({
                methods: {
                    // @ts-expect-error - Type 'unknown' is not assignable to type...
                    postMessage: windowsInteropPostMessage,
                    // @ts-expect-error - Type 'unknown' is not assignable to type...
                    addEventListener: windowsInteropAddEventListener,
                    // @ts-expect-error - Type 'unknown' is not assignable to type...
                    removeEventListener: windowsInteropRemoveEventListener
                }
            })
        },
        macos: () => {
            return new WebkitMessagingConfig({
                webkitMessageHandlerNames: [contextName],
                secret: '',
                hasModernWebkitAPI: true
            })
        }
    }[feature.platform.name]

    if (!config) {
        throw new Error('Messaging not supported yet on platform: ' + feature.platform.name)
    }

    return new Messaging(context, config())
}
