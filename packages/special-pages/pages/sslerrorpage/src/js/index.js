/**
 * @module SSLError Page
 * @category Special Pages
 *
 * @description
 *
 * [[include:packages/special-pages/pages/sslerrorpage/readme.md]]
 */

import { SSLErrorPageMessages, createSSLErrorMessaging } from './messages.js'

const messaging = createSSLErrorMessaging()

document.addEventListener('DOMContentLoaded', () => {
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
})
