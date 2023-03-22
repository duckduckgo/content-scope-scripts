/**
 * @module Example Page
 * @category Special Pages
 *
 * @description
 *
 * [[include:packages/special-pages/pages/example/readme.md]]
 */

import { Messaging, MessagingContext, WindowsMessagingConfig } from '../../../../messaging/index.js'
import { ExamplePageMessages } from './messages.js'
import { Pixel, OverlayPixel, PlayPixel, PlayDoNotUse } from './pixels.js'

/**
 * An example of initialising Windows messaging
 */
const config = new WindowsMessagingConfig({
    methods: {
        postMessage: (...args) => {
            console.log('postMessage', args)
        },
        addEventListener: (...args) => {
            console.log('addEventListener', args)
        },
        removeEventListener: (...args) => {
            console.log('removeEventListener', args)
        }
    }
})

const messagingContext = new MessagingContext({
    context: 'specialPages',
    featureName: 'examplePage'
})

const messages = new Messaging(messagingContext, config)
console.log(messages)

const h2 = document.createElement('h2')
h2.innerText = 'This is an appended element'
document.body.appendChild(h2)

try {
    // @ts-expect-error - this is deliberate to ensure tsc is checking this file
    document.body.appendChild('ooops!')
} catch (e) {
    console.log('warn: Expected error')
}

export { ExamplePageMessages, Pixel, OverlayPixel, PlayPixel, PlayDoNotUse }
