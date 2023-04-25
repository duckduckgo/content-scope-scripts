import {
    mockResponses,
    mockWindowsMessaging,
    readOutgoingMessages,
    simulateSubscriptionMessage,
    waitForCallCount
} from '../../../messaging/lib/test-utils.mjs'

export class Mocks {
    /**
     * @type {Record<string, any>}
     * @private
     */
    _defaultResponses = {}

    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@duckduckgo/messaging/lib/test-utils.mjs").PlatformInfo} platform
     * @param {import("@duckduckgo/messaging").MessagingContext} messagingContext
     */
    constructor (page, platform, messagingContext) {
        this.page = page
        this.platform = platform
        this.messagingContext = messagingContext
    }

    /**
     * @returns {Promise<void|*|string>}
     */
    async install () {
        this.page.on('console', (msg) => {
            console.log('->', msg.type(), msg.text())
        })
        await this.installMessagingMocks()
    }

    async installMessagingMocks () {
        await this.page.addInitScript(mockWindowsMessaging, {
            messagingContext: this.messagingContext,
            responses: this._defaultResponses
        })
    }

    /**
     * @param {Record<string, any>} responses
     */
    defaultResponses (responses) {
        this._defaultResponses = responses
    }

    /**
     * @param {string} name
     * @param {Record<string, any>} payload
     */
    async simulateSubscriptionMessage (name, payload) {
        await this.page.evaluate(simulateSubscriptionMessage, {
            messagingContext: this.messagingContext,
            name,
            payload,
            platform: this.platform
        })
    }

    /**
     * @param {{names: string[]}} [opts]
     * @returns {Promise<any[]>}
     */
    async outgoing (opts = { names: [] }) {
        const result = await this.page.evaluate(readOutgoingMessages)
        if (Array.isArray(opts.names) && opts.names.length > 0) {
            return result.filter(({ payload }) => opts.names.includes(payload.method))
        }
        return result
    }

    /**
     * @param {object} params
     * @param {string} params.method
     * @param {number} params.count
     * @return {Promise<*>}
     */
    async waitForCallCount (params) {
        await this.page.waitForFunction(waitForCallCount, params, { timeout: 3000, polling: 100 })
        return this.outgoing({ names: [params.method] })
    }
}
