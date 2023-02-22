/* global contentScopeFeatures */
import { isTrackerOrigin } from '../src/trackers'

const allowedMessages = [
    'getClickToLoadState',
    'getYouTubeVideoDetails',
    'openShareFeedbackPage',
    'setYoutubePreviewsEnabled',
    'unblockClickToLoadContent',
    'updateYouTubeCTLAddedFlag'
]
const messageSecret = randomString()

function randomString () {
    const num = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
    return num.toString().replace('0.', '')
}

function init () {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    contentScopeFeatures.load({
        platform: {
            name: 'extension'
        },
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        documentOriginIsTracker: isTrackerOrigin($TRACKER_LOOKUP$),
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        bundledConfig: $BUNDLED_CONFIG$
    })

    chrome.runtime.sendMessage({
        messageType: 'registeredContentScript',
        options: {
            documentUrl: window.location.href
        }
    },
    (message) => {
        // Background has disabled features
        if (!message) {
            return
        }
        if (message.debug) {
            window.addEventListener('message', (m) => {
                if (m.data.action && m.data.message) {
                    chrome.runtime.sendMessage({
                        messageType: 'debuggerMessage',
                        options: m.data
                    })
                }
            })
        }
        message.messageSecret = messageSecret
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        contentScopeFeatures.init(message)
    })

    chrome.runtime.onMessage.addListener((message) => {
        // forward update messages to the embedded script
        if (message && message.type === 'update') {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            contentScopeFeatures.update(message)
        }
    })

    window.addEventListener('sendMessageProxy' + messageSecret, (m) => {
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        const messageType = m.detail.messageType
        if (!allowedMessages.includes(messageType)) {
            return console.warn('Ignoring invalid sendMessage messageType', messageType)
        }
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        chrome.runtime.sendMessage(m && m.detail, response => {
            const msg = { func: messageType, response }
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            contentScopeFeatures.update({ detail: msg })
        })
    })
}

init()
