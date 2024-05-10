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
     * @return {Promise<import('../../../../types/new-tab.js').InitResponse>}
     */
    init () {
        if (this.injectName === 'integration') {
            return Promise.resolve({ favorites: {}, trackerStats: {} })
        }
        return this.messaging.request('init')
    }

    /**
     * @param {string} message
     */
    reportInitException (message) {
        this.messaging.notify('reportInitException', { message })
    }
}

const messaging = createSpecialPageMessaging({
    injectName: import.meta.injectName,
    env: import.meta.env,
    pageName: 'newTabPage'
})

const newTabMessaging = new NewTabPage(messaging, import.meta.injectName)
/** @type {'debug' | 'production'} */
let mode = 'production'
const param = new URL(window.location.href).searchParams.get('mode') || 'production'
if (param === 'debug' || param === 'production') {
    mode = param
}

init(newTabMessaging, mode).catch(e => {
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    newTabMessaging.reportInitException(msg)
})
