/**
 * @module Release Notes Page
 * @category Special Pages
 *
 * @description
 * TODO: description
 *
 */

/**
 * @typedef {Object} InitResponse
 * @property {ImportMeta['env']} [env] - optional override for the env
 * @property {string} [locale] - optional override for the locale
 */

import { init } from '../../app/index.js'
import { createSpecialPageMessaging } from '../../../../shared/create-special-page-messaging.js';
import { Environment } from '../../../../shared/components/EnvironmentProvider.js';
import { createTypedMessages } from '@duckduckgo/messaging';

/**
 * This describes the messages that will be sent to the native layer,
 */
export class ReleaseNotesPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @param {ImportMeta["injectName"]} injectName
     * @internal
     */
    constructor (messaging, injectName) {
        /**
         * @internal
         */
        this.messaging = createTypedMessages(this, messaging)
        this.injectName = injectName
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
                env: "development",
                locale: "en"
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
     * Subscribes to release info updates from browser
     * @param {(value: import('../../../../types/release-notes').UpdateMessage) => void} callback
     */
    subscribeToUpdates (callback) {
        if (this.injectName === 'integration') {
            return callback({
                version: 1.9,
                lastUpdate: Date.now(),
                status: 'loading',
                releaseNotes: `#Some markdown
                or something...`,
            });
        }

        return this.messaging.subscribe('onUpdate', callback)
    }
}

const baseEnvironment = new Environment()
    .withPlatform(document.documentElement.dataset.platform)
    .withEnv(import.meta.env) // use the build's ENV

// share this in the app, it's an instance of `ReleaseNotesMessages` where all your native comms should be
const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.platform,
    env: import.meta.env,
    pageName: 'example'
})

const messages = new ReleaseNotesPage(messaging, baseEnvironment.platform)

init(messages, baseEnvironment).catch(e => {
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    messages.reportInitException({ message: msg })
})
