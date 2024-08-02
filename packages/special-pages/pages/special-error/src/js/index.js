/**
 * @module SSL Error Page
 * @category Special Pages
 *
 * @description
 * Special Page that displays a
 */

import { createTypedMessages } from '@duckduckgo/messaging'
import { Environment } from '../../../../shared/environment.js'
import { createSpecialPageMessaging } from '../../../../shared/create-special-page-messaging.js'
import { init } from '../../app/index.js'

export class SpecialErrorPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor (messaging, env) {
        this.integration = env === 'integration'
        this.messaging = createTypedMessages(this, messaging)
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
     * @returns {Promise<import('../../../../types/special-error').InitialSetupResponse>}
     */
    initialSetup () {
        // TODO: Remove all integration rigging
        if (this.integration) {
            return Promise.resolve({
                env: 'development',
                locale: 'en',
                errorData: {
                    kind: 'phishing'
                }
            })
        }

        return this.messaging.request('initialSetup')
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
     * This will be sent when the user chooses to leave the current site
     */
    leaveSite () {
        this.messaging.notify('leaveSite')
    }

    /**
     * This will be sent when the user chooses to visit the current site despite warnings
     */
    visitSite () {
        this.messaging.notify('visitSite')
    }
}

const baseEnvironment = new Environment()
    .withPlatform(document.documentElement.dataset.platform)
    .withEnv(import.meta.env)

const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.platform,
    env: baseEnvironment.env,
    pageName: /** @type {string} */(import.meta.pageName)
})

const specialErrorPage = new SpecialErrorPage(messaging, baseEnvironment.platform)

init(specialErrorPage, baseEnvironment).catch(e => {
    // messages.
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    specialErrorPage.reportInitException({ message: msg })
})
