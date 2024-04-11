/**
 * @module SSLError Page
 * @category Special Pages
 *
 * @description
 *
 * [[include:packages/special-pages/pages/sslerrorpage/readme.md]]
 */

import { defaultLoadData } from './defaults.js'
import { createSSLErrorMessaging } from './messages.js'
import { createTypedMessages } from '@duckduckgo/messaging'
import { html, render } from 'lit'
import './ddg-ssl-warning.js'

export class SslerrorpagePage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor (messaging) {
        /**
         * @internal
         */
        this.messaging = createTypedMessages(this, messaging)
    }

    visitSite () {
        return this.messaging.notify('visitSite')
    }

    leaveSite () {
        return this.messaging.notify('leaveSite')
    }
}

async function init () {
    const messaging = await createSSLErrorMessaging({
        env: import.meta.env,
        injectName: import.meta.injectName
    })
    const page = new SslerrorpagePage(messaging)
    window.addEventListener('DOMContentLoaded', () => {
        loadHTML(page)
    })
}

init().catch(console.error)

/**
 * Construct the HTML, using data retrieved from the load-time JSON
 * @param {SslerrorpagePage} page
 */
function loadHTML (page) {
    const element = document.querySelector('[data-id="load-time-data"]')
    const parsed = (() => {
        try {
            return JSON.parse(element?.textContent || '{}')
        } catch (e) {
            console.warn('could not parse JSON', e)
            return {}
        }
    })()
    const container = document.createElement('div')
    if (!parsed.strings) {
        console.warn('missing `strings` from the incoming json data')
    }
    const mergedStrings = { ...defaultLoadData.strings, ...parsed.strings }
    const output = html`
        <ddg-ssl-warning 
                .strings=${mergedStrings} 
                @visit-site=${() => page.visitSite()}
                @leave-site=${() => page.leaveSite()}
        ></ddg-ssl-warning>
    `
    document.body.appendChild(container)
    render(output, container)
}
