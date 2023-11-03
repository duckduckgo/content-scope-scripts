import { Messaging, MessagingContext, TestTransportConfig, WebkitMessagingConfig, WindowsMessagingConfig, AndroidMessagingConfig } from '../packages/messaging/index.js'
import { SendMessageMessagingTransport } from './sendmessage-transport.js'

/**
  * Extracted so we can iterate on the best way to bring th
  * @param {{ name: string, isDebug: boolean }} feature
  * @return {MessagingContext}
  */
export function createMessagingContext (feature) {
    const injectName = import.meta.injectName
    if (typeof injectName === 'undefined') throw new Error('import.meta.injectName missing')
    const contextName = injectName === 'apple-isolated'
        ? 'contentScopeScriptsIsolated'
        : 'contentScopeScripts'

    return new MessagingContext({
        context: contextName,
        env: feature.isDebug ? 'development' : 'production',
        featureName: feature.name
    })
}

let androidGlobal

/**
 * Extracted so we can iterate on the best way to bring this to all platforms
 * @param {MessagingContext} context
 * @param {boolean} isDebug
 * @param {Record<string, any>} [platformSpecificConfigOptions]
 * @return {Messaging}
 */
export function createMessaging (context, isDebug, platformSpecificConfigOptions) {
    const injectName = import.meta.injectName
    if (typeof injectName === 'undefined') throw new Error('import.meta.injectName missing')
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
        android: () => {
            if (androidGlobal) return androidGlobal
            if (typeof platformSpecificConfigOptions === 'undefined') throw new Error('platformSpecificConfigOptions is missing for Android')
            const configConstruct = platformSpecificConfigOptions
            const messageCallback = configConstruct.messageCallback
            const secret = configConstruct.messageSecret
            const javascriptInterface = configConstruct.messageInterface
            androidGlobal = new AndroidMessagingConfig({
                secret,
                messageCallback,
                javascriptInterface,
                target: globalThis,
                debug: isDebug
            })
            return androidGlobal
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
