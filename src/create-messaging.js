import { Messaging, WebkitMessagingConfig, WindowsMessagingConfig } from '../packages/messaging/index.js'

/**
 * Extracted so we can iterate on the best way to bring this to all platforms
 * @param {import('./content-feature.js').default} feature
 * @param {string} injectName
 * @return {Messaging}
 */
export function createMessaging (feature, injectName) {
    const context = feature.messagingContext

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
                webkitMessageHandlerNames: [context.context],
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
