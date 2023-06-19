import { VideoParams } from './util.js'

export class OpenInDuckPlayer {
    /**
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} comms
     * @param {import("./util.js").DomState} domState
     */
    constructor (comms, domState) {
        this.clickBoundElements = new Map()
        this.enabled = false
        this.lastMouseOver = null
        this.comms = comms
        this.domState = domState
    }

    isSingleVideoURL (href) {
        return (
            href &&
            ((href.includes('/watch?v=') && !href.includes('&list=')) ||
                (href.includes('/watch?v=') && href.includes('&list=') && href.includes('&index='))) &&
            !href.includes('&pp=')
        )
    }

    bindEventsToAll () {
        if (!this.enabled) {
            return
        }

        const videoLinksAndPreview = Array.from(document.querySelectorAll('a[href^="/watch?v="], #media-container-link'))
        const isValidVideoLinkOrPreview = (element) => {
            return (
                this.isSingleVideoURL(element?.getAttribute('href')) ||
                element.getAttribute('id') === 'media-container-link'
            )
        }
        videoLinksAndPreview.forEach((element) => {
            if (this.clickBoundElements.has(element)) return
            if (!isValidVideoLinkOrPreview(element)) return

            const handler = {
                handleEvent (event) {
                    switch (event.type) {
                    case 'mouseover': {
                        const href = element instanceof HTMLAnchorElement ? VideoParams.fromHref(element.href)?.toPrivatePlayerUrl() : null
                        if (href) {
                            this.lastMouseOver = href
                        }
                        break
                    }
                    case 'click': {
                        event.preventDefault()
                        event.stopPropagation()

                        const link = event.target.closest('a')
                        const fromClosest = VideoParams.fromHref(link?.href)?.toPrivatePlayerUrl()

                        if (fromClosest) {
                            this.comms.openDuckPlayer({ href: fromClosest })
                        } else if (this.lastMouseOver) {
                            this.comms.openDuckPlayer({ href: this.lastMouseOver })
                        } else {
                            // Could not navigate, do nothing
                        }

                        break
                    }
                    }
                }
            }

            element.addEventListener('mouseover', handler, true)
            element.addEventListener('click', handler, true)

            this.clickBoundElements.set(element, handler)
        })
    }

    disable () {
        this.clickBoundElements.forEach((handler, element) => {
            element.removeEventListener('mouseover', handler, true)
            element.removeEventListener('click', handler, true)
            this.clickBoundElements.delete(element)
        })

        this.enabled = false
    }

    enable () {
        this.enabled = true
        this.bindEventsToAll()

        this.domState.onChanged(() => {
            this.bindEventsToAll()
        })
    }

    enableOnDOMLoaded () {
        this.enabled = true

        this.domState.onLoaded(() => {
            this.bindEventsToAll()

            this.domState.onChanged(() => {
                this.bindEventsToAll()
            })
        })
    }
}
