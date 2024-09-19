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
    createTypedMessages
} from '@duckduckgo/messaging'
import { createSpecialPageMessaging } from '../../../../shared/create-special-page-messaging'
import { Environment } from '../../../../shared/environment.js'
import { Stats } from "./stats.js";

export class NewTabPage {
    stats = new Stats(this)
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

export class IntegrationOverrides extends NewTabPage {
    /**
     * @return {Promise<import('../../../../types/new-tab.js').InitialSetupResponse>}
     */
    init () {
        return Promise.resolve({
            layout: {
                widgets: [
                    {
                        widgetName: 'Favorites',
                        visibility: 'visible',
                        expansion: 'expanded'
                    },
                    {
                        widgetName: 'PrivacyStats',
                        visibility: 'visible',
                        expansion: 'collapsed'
                    }
                ]
            },
            platform: { name: "windows" },
            env: "development",
            locale: "en"
        })
    }
}

const baseEnvironment = new Environment()
    .withInjectName(document.documentElement.dataset.platform)
    .withEnv(import.meta.env)

const messaging = createSpecialPageMessaging({
    injectName: import.meta.injectName,
    env: import.meta.env,
    pageName: 'newTabPage'
})

const newTabMessaging = baseEnvironment.injectName === 'integration' && !window.__playwright_01
    ? new NewTabPage(messaging, import.meta.injectName)
    : new IntegrationOverrides(messaging, import.meta.injectName)

/** @type {'debug' | 'production'} */
let mode = 'production'
const param = new URL(window.location.href).searchParams.get('mode') || 'production'
if (param === 'debug' || param === 'production') {
    mode = param
}

init(newTabMessaging, baseEnvironment).catch(e => {
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    newTabMessaging.reportInitException(msg)
})
