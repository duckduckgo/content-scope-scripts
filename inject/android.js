/**
 * @module Android integration
 * @category Content Scope Scripts Integrations
 */
import { load, init, update } from '../src/content-scope-features.js'
import { processConfig, isGloballyDisabled } from './../src/utils'

const allowedMessages = [
    'getClickToLoadState',
    'getYouTubeVideoDetails',
    'setYoutubePreviewsEnabled',
    'unblockClickToLoadContent',
    'updateYouTubeCTLAddedFlag'
]
const messageSecret = randomString()

function randomString () {
    const num = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
    return num.toString().replace('0.', '')
}

function initCode () {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$)
    if (isGloballyDisabled(processedConfig)) {
        return
    }

    load({
        platform: processedConfig.platform
    })

    processedConfig.messageSecret = messageSecret
    init(processedConfig)

    // @ts-ignore
    window.clickToLoadMessageCallback = (message) => {
        update(message)
    }

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
        // @ts-ignore
        window.ClickToLoadAndroid.process(stringifiedArgs)
    })
}

initCode()
