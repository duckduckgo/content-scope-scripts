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

async function init () {
    const messaging = await createSSLErrorMessaging()
    loadHTML()
    bindEvents(messaging)
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
 * @param {Pick<import("./messages").SSLErrorPageMessages, 'leaveSite' | 'visitSite'>} messaging
 */
function bindEvents (messaging) {
    const advanced = document.getElementById('advancedBtn')
    const info = document.getElementById('advancedInfo')

    if (!advanced || !info) return console.error('unreachable: missing elements')

    advanced.addEventListener('click', function () {
        info.classList.toggle('closed')
        advanced.style.display = 'none'
    })

    const acceptRiskLink = document.getElementById('acceptRiskLink')
    if (acceptRiskLink) {
        acceptRiskLink.addEventListener('click', (event) => {
            event.preventDefault()
            messaging.visitSite()
        })
    } else {
        console.error('Accept risk link not found.')
    }

    const leaveSiteButton = document.getElementById('leaveThisSiteBtn')
    if (leaveSiteButton) {
        leaveSiteButton.addEventListener('click', (event) => {
            event.preventDefault()
            messaging.leaveSite()
        })
    } else {
        console.error('Leave Site button not found.')
    }
}
