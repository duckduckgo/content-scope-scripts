/**
 * @module Example Page
 * @category Special Pages
 *
 * @description
 *
 * [[include:packages/special-pages/pages/example/readme.md]]
 */

import { ExamplePageMessages } from './messages.js'
import { Pixel, OverlayPixel, PlayPixel, PlayDoNotUse } from './pixels.js'
import { createSpecialPageMessaging } from '../../../shared/create-special-page-messaging'

const messaging = createSpecialPageMessaging({
    injectName: import.meta.injectName,
    env: import.meta.env,
    pageName: 'examplePage'
})

console.log(messaging)

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
