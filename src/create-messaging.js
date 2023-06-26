import { Messaging, MessagingContext, WebkitMessagingConfig, WindowsMessagingConfig } from '../packages/messaging/index.js'

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

    /** @type {Partial<Record<NonNullable<ImportMeta['injectName']>, () => any>>} */
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
        'apple-isolated': () => {
            return new WebkitMessagingConfig({
                webkitMessageHandlerNames: [contextName],
                secret: '',
                hasModernWebkitAPI: true
            })
        }
    }

    const match = config[injectName]

    if (!match) {
        throw new Error('Messaging not supported yet on: ' + injectName)
    }

    return new Messaging(context, match())
}
