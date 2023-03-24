/**
 * Install a mock interface for webkit messaging
 * @param {{messagingContext: import('../index.js').MessagingContext}} params
 */
export function mockWebkit(params) {
    window.__playwright_01 = {
        mockResponses: {},
        subscriptionEvents: [],
        mocks: {
            outgoing: []
        }
    }

    function recordOutgoing (payload) {
        /** @type {UnstableMockCall} */
        const call = {
            payload: payload
        }
        window.__playwright_01.mocks.outgoing.push(JSON.parse(JSON.stringify(call)))
    }

    window.webkit = {
        messageHandlers: {
            [params.messagingContext.context]: {
                /**
                 * @param {import("../../messaging/index.js").RequestMessage} msg
                 * @return {Promise<string>}
                 */
                postMessage: async (msg) => {
                    recordOutgoing(msg)
                    if ('id' in msg) {
                        if (msg.method in window.__playwright_01.mockResponses) {
                            return JSON.stringify(window.__playwright_01.mockResponses[msg.method])
                        } else {
                            console.warn('response not found for ' + msg.method)
                            throw new Error('response not found for ' + msg.method);
                        }
                    }
                    return undefined;
                }
            }
        }
    }
}

/**
 * Install a mock interface for windows messaging
 * @param {{messagingContext: import('../index.js').MessagingContext}} params
 */
export function mockWindows(params) {
    window.__playwright_01 = {
        mockResponses: {},
        subscriptionEvents: [],
        mocks: {
            outgoing: []
        }
    }
    const listeners = []
    function recordOutgoing (payload, response) {
        /** @type {UnstableMockCall} */
        const call = {
            payload,
            response
        }
        window.__playwright_01.mocks.outgoing.push(JSON.parse(JSON.stringify(call)))
    }
    /**
     * @param {import("../../messaging/index.js").RequestMessage} msg
     * @param response
     */
    function respond (msg, response) {
        setTimeout(() => {
            for (const listener of listeners) {
                listener({
                    origin: window.origin,
                    data: {
                        result: response,
                        context: msg.context,
                        featureName: msg.featureName,
                        id: msg.id,
                    },
                })
            }
        }, 0)
    }

    function isOutgoing (message) {
        if (typeof message.method === 'string' &&
            typeof message.featureName === 'string' &&
            typeof message.context === 'string'
        ) {
            return true
        }
        return false
    }

    function isSubscriptionEvent (message) {
        if (typeof message.subscriptionName === 'string' &&
            typeof message.featureName === 'string' &&
            typeof message.context === 'string'
        ) {
            return true
        }
        return false
    }

    window.chrome = {
        // @ts-ignore
        webview: {
            /**
             * @param {import("../../messaging/lib/windows.js").WindowsNotification | import("../../messaging/lib/windows.js").WindowsRequestMessage} input
             */
            postMessage (input) {
                /** @type {import("../../messaging/index.js").NotificationMessage | import("../../messaging/index.js").RequestMessage} */
                let msg;
                if ('Id' in input) {
                    msg = {
                        id: input.Id,
                        context: input.Feature,
                        featureName: input.SubFeatureName,
                        params: input.Data,
                        method: input.Name
                    }
                } else {
                    msg = {
                        context: input.Feature,
                        featureName: input.SubFeatureName,
                        params: input.Data,
                        method: input.Name
                    }
                }
                if (isOutgoing(msg)) {
                    recordOutgoing(msg, undefined)
                    if ('id' in msg) {
                        if (msg.method in window.__playwright_01.mockResponses) {
                            respond(msg, window.__playwright_01.mockResponses[msg.method]);
                        } else {
                            throw new Error('response not found for ' + msg.method);
                        }
                    }
                } else if (isSubscriptionEvent(input)) {
                    setTimeout(() => {
                        for (const listener of listeners) {
                            listener({
                                origin: window.origin,
                                data: input
                            })
                        }
                    }, 0)
                } else {
                    console.warn('cannot handle input', input)
                }
            },
            removeEventListener (_name, _listener) {
                const index = listeners.indexOf(_listener)
                if (index > -1) {
                    listeners.splice(index, 1)
                }
            },
            addEventListener (_name, listener) {
                listeners.push(listener)
            }
        }
    }
}

export function removeChromeWebView() {
    Object.assign(globalThis, {
        // @ts-expect-error
        windowsInteropPostMessage: window.chrome.webview.postMessage,
        // @ts-expect-error
        windowsInteropAddEventListener: window.chrome.webview.addEventListener,
        // @ts-expect-error
        windowsInteropRemoveEventListener: window.chrome.webview.removeEventListener
    })
}

/**
 * @param {object} params
 * @param {Record<string, any>} params.responses
 */
export function mockResponse(params) {
    window.__playwright_01.mockResponses = {
        ...window.__playwright_01.mockResponses,
        ...params.responses
    }
}

/**
 * @param {object} params
 * @param {string} params.method
 * @param {number} params.count
 */
export function waitForCallCount(params) {
    const outgoing = window.__playwright_01.mocks.outgoing
    const filtered = outgoing.filter(({ payload }) => params.method === payload.method)
    return filtered.length === params.count
}

/**
 * Just access to readOutgoingMessages
 * @return {any}
 */
export function readOutgoingMessages() {
    return window.__playwright_01.mocks.outgoing
}

/**
 * @param {object} params
 * @param {import('../index.js').MessagingContext} params.messagingContext
 * @param {string} params.name
 * @param {Record<string, any>} params.payload
 * @param {TestPlatform} params.platform
 */
export function simulateSubscriptionMessage(params) {
    switch (params.platform.name) {
    case "windows": {
        // @ts-expect-error
        window.chrome.webview.postMessage({
            context: params.messagingContext.context,
            featureName: params.messagingContext.featureName,
            subscriptionName: params.name,
            params: params.payload,
        })
        break;
    }
    case "apple": {
        const methodName = 'webkitSubscriptionHandler_'
            + params.messagingContext.context
            + '_'
            + params.messagingContext.featureName
            + '_'
            + params.name
        if (!window[methodName]) throw new Error('cannot access webkit subscription handler');
        window[methodName].call(null, params.payload)
        break;
    }
    }
}

export class TestPlatform {
    /**
     * @param {object} params
     * @param {"apple" | "windows"} params.name
     */
    constructor (params) {
        this.name = params.name;
    }
}
