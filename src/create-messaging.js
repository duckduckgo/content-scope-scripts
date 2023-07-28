import { Messaging, MessagingContext, TestTransportConfig, WebkitMessagingConfig, WindowsMessagingConfig } from '../packages/messaging/index.js'
import { SendMessageMessagingTransport } from './sendmessage-transport.js'

/**
 * Extracted so we can iterate on the best way to bring this to all platforms
 * @param {{ name: string, isDebug: boolean }} feature
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

    const createExtensionConfig = () => {
        const messagingTransport = new SendMessageMessagingTransport()
        return new TestTransportConfig(messagingTransport)
    }

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
        },
        firefox: createExtensionConfig,
        chrome: createExtensionConfig,
        'chrome-mv3': createExtensionConfig,
        integration: () => {
            return new TestTransportConfig({
                notify () {
                    // noop
                },
                request: async () => {
                    // noop
                },
                subscribe () {
                    return () => {
                        // noop
                    }
                }
            })
        }
    }

    const match = config[injectName]

    if (!match) {
        throw new Error('Messaging not supported yet on: ' + injectName)
    }

    return new Messaging(context, match())
}
