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
    loadHTML()
    bindEvents(page)
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

/**
 * @param {SslerrorpagePage} page
 */
function bindEvents (page) {
    const advanced = document.getElementById('advancedBtn')
    const info = document.getElementById('advancedInfo')
    const fullContainer = document.getElementById('fullContainer')

    if (!advanced || !info) return console.error('unreachable: missing elements')

    advanced.addEventListener('click', function () {
        info.classList.toggle('closed')
        advanced.style.display = 'none'
        if (fullContainer) {
            fullContainer.style.borderRadius = '8px'
        }
    })

    const acceptRiskLink = document.getElementById('acceptRiskLink')
    if (acceptRiskLink) {
        acceptRiskLink.addEventListener('click', (event) => {
            event.preventDefault()
            page.visitSite()
        })
    } else {
        console.error('Accept risk link not found.')
    }

    const leaveSiteButton = document.getElementById('leaveThisSiteBtn')
    if (leaveSiteButton) {
        leaveSiteButton.addEventListener('click', (event) => {
            event.preventDefault()
            page.leaveSite()
        })
    } else {
        console.error('Leave Site button not found.')
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const fullContainer = /** @type {HTMLElement | null} */(document.querySelector('.full-container'))
    let maxHeight = 320
    const advanced = document.getElementById('advancedBtn')

    function updateStyles () {
        if (fullContainer) {
            if (window.innerHeight <= maxHeight) {
                fullContainer.style.top = '40px'
                fullContainer.style.transform = 'translateX(-50%)'
            } else {
                fullContainer.style.top = '50%'
                fullContainer.style.transform = 'translate(-50%, calc(-50% - 16px))'
            }
        }
    }

    updateStyles()

    window.addEventListener('resize', updateStyles)
    if (!advanced) return console.error('unreachable: missing elements')
    advanced.addEventListener('click', function () {
        maxHeight = 460
        updateStyles()
    })
})
