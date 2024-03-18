/**
 * @module SSLError Page
 * @category Special Pages
 *
 * @description
 *
 * [[include:packages/special-pages/pages/sslerrorpage/readme.md]]
 */

import { Messaging, MessagingContext, WebkitMessagingConfig } from '@duckduckgo/messaging'
import { SSLErrorPageMessages } from './messages.js'

const config = new WebkitMessagingConfig({
    hasModernWebkitAPI: true,
    secret: 'SECRET',
    webkitMessageHandlerNames: ['contentScopeScripts']
})

const messagingContext = new MessagingContext({
    context: 'specialPages',
    featureName: 'sslErrorPage',
    env: 'development'
})

const messages = new Messaging(messagingContext, config)
const sslErrorPageMessages = new SSLErrorPageMessages(messages)
console.log(messages)

document.addEventListener('DOMContentLoaded', () => {
    const acceptRiskLink = document.getElementById('acceptRiskLink')
    if (acceptRiskLink) {
        acceptRiskLink.addEventListener('click', (event) => {
            event.preventDefault()
            // Ensure this matches the expected format for the notify method
            sslErrorPageMessages.notify({ action: 'visitSite'})
        })
    } else {
        console.error('Accept risk link not found.')
    }

    const leaveSiteButton = document.getElementById('leaveThisSiteBtn')
    if (leaveSiteButton) {
        leaveSiteButton.addEventListener('click', (event) => {
            event.preventDefault()
            sslErrorPageMessages.notify({ action: "leaveSite" })
        });
    } else {
        console.error('Leave Site button not found.')
    }
})