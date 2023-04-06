/**
 * @module Android integration
 * @category Content Scope Scripts Integrations
 */
import { load, init, update } from '../src/content-scope-features.js'
import { processConfig, isGloballyDisabled } from './../src/utils'

const allowedMessages = [
    'getClickToLoadState',
    'getYouTubeVideoDetails',
    'openShareFeedbackPage',
    'setYoutubePreviewsEnabled',
    'unblockClickToLoadContent',
    'updateYouTubeCTLAddedFlag'
]

function initCode () {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$)
    if (isGloballyDisabled(processedConfig)) {
        return
    }

    load({
        platform: processedConfig.platform
    })

    const messageSecret = processedConfig.messageSecret
    // Receives messages from the platform
    const messageCallback = processedConfig.messageCallback
    // Sends messages to the platform
    const messageInterface = processedConfig.messageInterface

    const wrappedUpdate = ((providedSecret, ...args) => {
        if (providedSecret === messageSecret) {
            update(...args)
        }
    }).bind()

    Object.defineProperty(window, messageCallback, {
        value: wrappedUpdate
    })

    // @ts-ignore
    const sendMessageToAndroid = window[messageInterface].process.bind(window[messageInterface])
    delete window[messageInterface]

    init(processedConfig)

    window.addEventListener('sendMessageProxy' + messageSecret, event => {
        event.stopImmediatePropagation()

        if (!(event instanceof CustomEvent) || !event?.detail) {
            return console.warn('no details in sendMessage proxy', event)
        }

        const messageType = event.detail?.messageType
        if (!allowedMessages.includes(messageType)) {
            return console.warn('Ignoring invalid sendMessage messageType', messageType)
        }

        const message = {
            type: messageType,
            options: event.detail?.options
        }
        const stringifiedArgs = JSON.stringify(message)
        sendMessageToAndroid(stringifiedArgs, messageSecret)
    })
}

initCode()
