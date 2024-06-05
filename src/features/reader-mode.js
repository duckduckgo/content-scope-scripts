/**
 * @module Reader Mode
 *
 * @description
 *
 * Adds a reader mode to the browser.
 *
 *
 */
import { Readability, isProbablyReaderable } from '@mozilla/readability'
import ContentFeature from '../content-feature'

/**
 * Adds a reader mode button.
 * @internal
 */
export default class ReaderMode extends ContentFeature {
    init () {
        document.addEventListener('DOMContentLoaded', this.createButton.bind(this))
    }

    createButton () {
        console.log(isProbablyReaderable(document))
        const button = document.createElement('button')
        button.textContent = isProbablyReaderable(document) ? 'Reader Mode' : 'Reader Mode (Forced)'
        button.addEventListener('click', this.activateReaderMode.bind(this))
        button.style.position = 'fixed'
        button.style.top = '0'
        button.style.right = '0'
        button.style.zIndex = '999999'
        button.style.padding = '10px'
        document.body.appendChild(button)
    }

    activateReaderMode () {
        /** @type {Document} */
        // @ts-expect-error this is a document
        const doc = document.cloneNode(true)
        const options = {
            debug: false
        }
        const article = new Readability(doc, options)
        const reader = article.parse()
        console.log(reader)

        if (reader) {
            // construct URL and pass reader content in get parameter
            const base = 'https://muodov-playground.glitch.me/reflect-xss.html'
            const url = new URL(base)
            url.searchParams.set('content', reader.content)
            location.href = url.href
        }
    }
}
