import 'preact/devtools'
/**
 * @module New Tab Page
 * @category Special Pages
 *
 * New Tab Page
 *
 */
import { init } from '../../app/index.js'
import {
    createTypedMessages, TestTransportConfig,
    Messaging
} from '@duckduckgo/messaging'
import { createSpecialPageMessaging } from '../../../../shared/create-special-page-messaging'
import { Environment } from '../../../../shared/environment.js'
import { mockTransport } from "./mock-transport.js";

export class NewTabPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @param {ImportMeta['injectName']} injectName
     */
    constructor (messaging, injectName) {
        /**
         * @internal
         */
        this.messaging = createTypedMessages(this, messaging)
        this.injectName = injectName
    }

    /**
     * @return {Promise<import('../../../../types/new-tab.js').InitialSetupResponse>}
     */
    init () {
        return this.messaging.request('initialSetup')
    }

    /**
     * @param {string} message
     */
    reportInitException (message) {
        this.messaging.notify('reportInitException', { message })
    }

    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @param {{message: string}} params
     */
    reportPageException (params) {
        this.messaging.notify('reportPageException', params)
    }
}

const baseEnvironment = new Environment()
    .withInjectName(import.meta.injectName)
    .withEnv(import.meta.env)

const messaging = createSpecialPageMessaging({
    injectName: import.meta.injectName,
    env: import.meta.env,
    pageName: 'newTabPage',
    mockTransport: () => {
        // only in integration environments
        if (baseEnvironment.injectName !== 'integration') return null
        // never in playwright environments
        if (window.__playwright_01) return null
        let mock = null;
        // todo(shane): use ESBUILD to drop these labels
        $INTEGRATION: mock = mockTransport()
        return mock
    }
})

const newTabMessaging = new NewTabPage(messaging, import.meta.injectName)
init(newTabMessaging, baseEnvironment).catch(e => {
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    newTabMessaging.reportInitException(msg)
})
