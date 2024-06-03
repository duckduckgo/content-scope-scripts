/**
 * @module SpecialError Page
 * @category Special Pages
 *
 * @description
 *
 * [[include:packages/special-pages/pages/specialerrorpage/readme.md]]
 */

import { execTemplate } from './template.js'
import { loadData } from './loadData.js'
import { createTypedMessages } from '@duckduckgo/messaging'
import { createSpecialPageMessaging } from '../../../../shared/create-special-page-messaging'

export class SpecialerrorpagePage {
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

const messaging = createSpecialPageMessaging({
    env: import.meta.env,
    injectName: import.meta.injectName,
    pageName: 'specialErrorPage'
})

const page = new SpecialerrorpagePage(messaging)
window.addEventListener('DOMContentLoaded', () => {
    loadHTML()
    bindEvents(page)
})

/**
 * Construct the HTML, using data retrieved from the load-time JSON
 */
function loadHTML () {
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
    const mergedStrings = { ...loadData.ssl.strings, ...parsed.strings }
    container.innerHTML = execTemplate(mergedStrings).toString()
    document.body.appendChild(container)
}

/**
 * @return {{
 *   advanced: HTMLElement | null,
 *   acceptRiskLink: HTMLElement | null,
 *   leaveThisSiteBtn: HTMLElement | null,
 *   fullContainer: HTMLElement | null,
 * }}
 */
function domElements () {
    return {
        advanced: document.getElementById('advancedBtn'),
        fullContainer: document.getElementById('fullContainer'),
        acceptRiskLink: document.getElementById('acceptRiskLink'),
        leaveThisSiteBtn: document.getElementById('leaveThisSiteBtn')
    }
}

/**
 * @param {SpecialerrorpagePage} page
 */
function bindEvents (page) {
    const dom = domElements()

    if (!dom.advanced) return console.error('ts unreachable: missing elements')

    dom.advanced.addEventListener('click', function () {
        if (!dom.fullContainer) return console.error('ts unreachable: missing elements')
        dom.fullContainer.dataset.state = 'open'
    })

    if (dom.acceptRiskLink) {
        dom.acceptRiskLink.addEventListener('click', (event) => {
            event.preventDefault()
            page.visitSite()
        })
    } else {
        console.error('Accept risk link not found.')
    }

    if (dom.leaveThisSiteBtn) {
        dom.leaveThisSiteBtn?.addEventListener('click', (event) => {
            event.preventDefault()
            page.leaveSite()
        })
    } else {
        console.error('Leave Site button not found.')
    }
}
