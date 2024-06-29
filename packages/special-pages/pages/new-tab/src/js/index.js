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

init(newTabMessaging).catch(e => {
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    newTabMessaging.reportInitException(msg)
})
