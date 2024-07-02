/**
 * @module Release Notes Page
 * @category Special Pages
 *
 * @description
 * Special Page that displays release notes for the browser's current or updated version
 */

/**
 * @typedef {import('../../../../types/release-notes').UpdateMessage} UpdateMessage
 */

/**
 * @typedef {Object} InitResponse
 * @property {ImportMeta['env']} [env] - optional override for the env
 * @property {string} [locale] - optional override for the locale
 */

import { init } from '../../app/index'
import { createSpecialPageMessaging } from '../../../../shared/create-special-page-messaging'
import { Environment } from '../../../../shared/environment'
import { createTypedMessages } from '@duckduckgo/messaging'
import { sampleData } from '../../app/sampleData'

/**
 * This describes the messages that will be sent to the native layer,
 */
export class ReleaseNotesPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @param {ImportMeta["injectName"]} injectName
     * @param {UpdateMessage['status']} status
     * @internal
     */
    constructor (messaging, injectName, status = 'loaded') {
        /**
         * @internal
         */
        this.messaging = createTypedMessages(this, messaging)
        this.injectName = injectName

        this.setupIntegration(status)
    }

    /**
     * Sets up integration environment
     * @param {UpdateMessage['status']} status
     */
    setupIntegration (status) {
        if (this.injectName !== 'integration') return
        const allowedStates = Object.keys(sampleData)

        this.integrationState = status && allowedStates.includes(status)
            ? status
            : 'loaded' // Default state for integration
    }

    /**
     * Sends an initial message to the native layer. This is the opportunity for the native layer
     * to provide the initial state of the application or any configuration, for example:
     *
     * ```json
     * {
     *   "env": "development",
     *   "locale": "en"
     * }
     * ```
     *
     * @returns {Promise<InitResponse>}
     */
    async initialSetup () {
        if (this.injectName === 'integration') {
            return {
                env: 'development',
                locale: 'en'
            }
        }
        return await this.messaging.request('initialSetup')
    }

    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @param {{message: string}} params
     */
    reportPageException (params) {
        this.messaging.notify('reportPageException', params)
    }

    /**
     * This will be sent if the application fails to load.
     * @param {{message: string}} params
     */
    reportInitException (params) {
        this.messaging.notify('reportInitException', params)
    }

    /**
     * Forwards a click on restart button to browser
     */
    browserRestart () {
        this.messaging.notify('browserRestart', {})
    }

    /**
     * Subscribes to release info updates from browser
     * @param {(value: import('../../../../types/release-notes').UpdateMessage) => void} callback
     */
    onUpdate (callback) {
        if (this.integrationState && callback) {
            callback(sampleData.loading)

            // Simulates load latency
            if (this.integrationState !== 'loading') {
                setTimeout(() => {
                    this.integrationState && callback(sampleData[this.integrationState])
                }, 1000)
            }

            return () => { console.log('Unsubscribed') }
        }

        return this.messaging.subscribe('onUpdate', callback)
    }
}

const url = new URL(window.location.href)
const params = Object.fromEntries(url.searchParams)
const display = /** @type {'app'|'components'} */(params.display || 'app')
const status = /** @type {UpdateMessage['status']} */(params.state || 'loaded')

const baseEnvironment = new Environment()
    .withPlatform(document.documentElement.dataset.platform)
    .withEnv(import.meta.env) // use the build's ENV
    .withDisplay(display)

// share this in the app, it's an instance of `ReleaseNotesMessages` where all your native comms should be
const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.platform,
    env: import.meta.env,
    pageName: 'releaseNotes'
})

const messages = new ReleaseNotesPage(messaging, baseEnvironment.platform, status)

init(messages, baseEnvironment).catch(e => {
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    messages.reportInitException({ message: msg })
})
