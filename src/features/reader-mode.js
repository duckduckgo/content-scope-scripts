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
export class ReaderMode extends ContentFeature {
    init () {
        document.addEventListener('DOMContentLoaded', this.checkReaderable.bind(this))
        this.subscribe('extractReaderContent', this.activateReaderMode.bind(this))
    }

    checkReaderable () {
        const isReaderable = isProbablyReaderable(document)
        if (isReaderable) {
            console.log('Reader mode is available, notifying the browser...')
            this.notify('readerModeAvailable')
        }
    }

    activateReaderMode () {
        console.log('extractReaderContent received')
        /** @type {Document} */
        // @ts-expect-error this is a document
        const doc = document.cloneNode(true)
        const options = {
            debug: false
        }
        const article = new Readability(doc, options)
        const reader = article.parse()
        console.log('reader result:', reader)
        console.log('sending the reader content to the browser...')

        if (reader) {
            this.notify('readerContentExtracted', {
                readerContent: {
                    url: globalThis.location.href,
                    byline: reader.byline,
                    html: reader.content,
                    dir: reader.dir,
                    excerpt: reader.excerpt,
                    language: reader.lang,
                    length: reader.length,
                    publicationDate: reader.publishedTime,
                    siteName: reader.siteName,
                    text: reader.textContent,
                    title: reader.title
                },
                isError: false
            })
        } else {
            this.notify('readerContentExtracted', {
                readerContent: {
                    url: globalThis.location.href,
                    html: '',
                    length: 0,
                    text: 'No'
                },
                isError: true
            })
        }
    }
}

export default ReaderMode
