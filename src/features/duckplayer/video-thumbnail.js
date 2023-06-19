import { addTrustedEventListener } from './util.js'

export class VideoThumbnail {
    /**
     * @param {import("./icon-overlay.js").IconOverlay} iconOverlay
     */
    constructor (iconOverlay) {
        this.hoverBoundElements = new WeakMap()
        this.iconOverlay = iconOverlay
    }

    isSingleVideoURL (href) {
        return (
            href &&
            ((href.includes('/watch?v=') && !href.includes('&list=')) ||
                (href.includes('/watch?v=') && href.includes('&list=') && href.includes('&index='))) &&
            !href.includes('&pp=')
        )
    }

    findAll () {
        const linksToVideos = (item) => {
            const href = item.getAttribute('href')
            return this.isSingleVideoURL(href)
        }

        const linksWithImages = (item) => {
            return item.querySelector('img')
        }

        const linksWithoutSubLinks = (item) => {
            return !item.querySelector('a[href^="/watch?v="]')
        }

        const linksNotInVideoPreview = (item) => {
            const linksInVideoPreview = Array.from(document.querySelectorAll('#preview a'))

            return linksInVideoPreview.indexOf(item) === -1
        }

        const linksNotAlreadyBound = (item) => {
            return !this.hoverBoundElements.has(item)
        }

        return Array.from(document.querySelectorAll('a[href^="/watch?v="]')).filter(linksNotAlreadyBound).filter(linksToVideos).filter(linksWithoutSubLinks).filter(linksNotInVideoPreview).filter(linksWithImages)
    }

    bindEvents (video) {
        if (video) {
            addTrustedEventListener(video, 'mouseover', () => {
                this.iconOverlay.moveHoverOverlayToVideoElement(video)
            })

            addTrustedEventListener(video, 'mouseout', (e) => this.iconOverlay.hideHoverOverlay(e))

            this.hoverBoundElements.set(video, true)
        }
    }

    bindEventsToAll () {
        this.findAll().forEach((video) => this.bindEvents(video))
    }
}
