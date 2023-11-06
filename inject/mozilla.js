/**
 * @module Mozilla integration
 * @category Content Scope Scripts Integrations
 */
import { load, init, update } from '../src/content-scope-features.js'
import { isTrackerOrigin } from '../src/trackers'
import { computeLimitedSiteObject } from '../src/utils.js'

const allowedMessages = [
    'getClickToLoadState',
    'getYouTubeVideoDetails',
    'openShareFeedbackPage',
    'addDebugFlag',
    'setYoutubePreviewsEnabled',
    'unblockClickToLoadContent',
    'updateYouTubeCTLAddedFlag',
    'updateFacebookCTLBreakageFlags'
]
const messageSecret = randomString()

function randomString () {
    const num = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
    return num.toString().replace('0.', '')
}

function initCode () {
    const trackerLookup = import.meta.trackerLookup
    load({
        platform: {
            name: 'extension'
        },
        trackerLookup,
        documentOriginIsTracker: isTrackerOrigin(trackerLookup),
        site: computeLimitedSiteObject(),
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
        init(message)
    })

    chrome.runtime.onMessage.addListener((message) => {
        // forward update messages to the embedded script
        if (message && message.type === 'update') {
            update(message)
        }
    })

    window.addEventListener('sendMessageProxy' + messageSecret, event => {
        event.stopImmediatePropagation()

        if (!(event instanceof CustomEvent) || !event?.detail) {
            return console.warn('no details in sendMessage proxy', event)
        }

        const messageType = event.detail?.messageType
        if (!allowedMessages.includes(messageType)) {
            return console.warn('Ignoring invalid sendMessage messageType', messageType)
        }

        chrome.runtime.sendMessage(event.detail, response => {
            const message = {
                messageType: 'response',
                responseMessageType: messageType,
                response
            }

            update(message)
        })
    })
}

initCode()
