/**
 * @module SSLError Page
 * @category Special Pages
 *
 * @description
 *
 * [[include:packages/special-pages/pages/sslerrorpage/readme.md]]
 */

import { createSSLErrorMessaging } from './messages.js'
import { execTemplate } from './template'
import { defaultLoadData } from './defaults'

const messaging = createSSLErrorMessaging()

document.addEventListener('DOMContentLoaded', () => {
    loadHTML()
    bindEvents()
})

function loadHTML () {
    const element = document.querySelector('[data-id="load-time-data"]')
    const parsed = JSON.parse(element?.textContent || '{}')
    const container = document.createElement('div')
    container.innerHTML = execTemplate({ ...defaultLoadData.strings, ...parsed.strings }).toString()
    document.body.appendChild(container)
}

function bindEvents () {
    const acceptRiskLink = document.getElementById('acceptRiskLink')
    if (acceptRiskLink) {
        acceptRiskLink.addEventListener('click', (event) => {
            event.preventDefault()
            messaging.notify('visitSite')
        })
    } else {
        console.error('Accept risk link not found.')
    }

    const leaveSiteButton = document.getElementById('leaveThisSiteBtn')
    if (leaveSiteButton) {
        leaveSiteButton.addEventListener('click', (event) => {
            event.preventDefault()
            messaging.notify('leaveSite')
        })
    } else {
        console.error('Leave Site button not found.')
    }
}
