/**
 * @module SSLError Page
 * @category Special Pages
 *
 * @description
 *
 * [[include:packages/special-pages/pages/sslerrorpage/readme.md]]
 */

import { execTemplate } from './template.js'
import { defaultLoadData } from './defaults.js'
import { createSSLErrorMessaging } from './messages.js'
import { createTypedMessages } from '@duckduckgo/messaging'

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
        loadHTML()
        bindEvents(page)
        adjustStyles()
    })
}

init().catch(console.error)

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
    const mergedStrings = { ...defaultLoadData.strings, ...parsed.strings }
    container.innerHTML = execTemplate(mergedStrings).toString()
    document.body.appendChild(container)
}

function domElements () {
    return {
        advanced: document.getElementById('advancedBtn'),
        info: document.getElementById('advancedInfo'),
        fullContainer: document.getElementById('fullContainer'),
        acceptRiskLink: document.getElementById('acceptRiskLink'),
        leaveThisSiteBtn: document.getElementById('leaveThisSiteBtn')
    }
}

/**
 * @param {SslerrorpagePage} page
 */
function bindEvents (page) {
    const dom = domElements()

    if (!dom.advanced || !dom.info) return console.error('ts unreachable: missing elements')

    dom.advanced.addEventListener('click', function () {
        if (!dom.advanced || !dom.info || !dom.fullContainer) return console.error('ts unreachable: missing elements')

        dom.info.classList.toggle('closed')
        dom.advanced.style.display = 'none'

        if (dom.fullContainer) {
            dom.fullContainer.style.borderRadius = '8px'
        }
    })

    if (dom.acceptRiskLink) {
        dom.acceptRiskLink.addEventListener('click', (event) => {
            event.preventDefault()
            page.visitSite()
        })
    } else {
        console.error('Accept risk link not found.')
    }

    if (dom.leaveSiteButton) {
        dom.leaveSiteButton.addEventListener('click', (event) => {
            event.preventDefault()
            page.leaveSite()
        })
    } else {
        console.error('Leave Site button not found.')
    }
}

function adjustStyles () {
    const dom = domElements()
    let maxHeight = 320

    function updateStyles () {
        if (dom.fullContainer) {
            if (window.innerHeight <= maxHeight) {
                dom.fullContainer.style.top = '40px'
                dom.fullContainer.style.transform = 'translateX(-50%)'
            } else {
                dom.fullContainer.style.top = '50%'
                dom.fullContainer.style.transform = 'translate(-50%, calc(-50% - 16px))'
            }
        }
    }

    updateStyles()

    window.addEventListener('resize', updateStyles)

    dom.advanced?.addEventListener('click', function () {
        maxHeight = 460
        updateStyles()
    })
}
