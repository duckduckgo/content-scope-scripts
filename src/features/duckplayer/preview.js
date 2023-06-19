import { addTrustedEventListener, VideoParams } from './util.js'

export class Preview {
    /**
     * @param {import("./yt-overlays.js").Environment} environment
     * @param {import("./icon-overlay.js").IconOverlay} iconOverlay
     */
    constructor (environment, iconOverlay) {
        this.environment = environment
        this.iconOverlay = iconOverlay
    }

    /**
     * Get the video hover preview link
     * @returns {HTMLElement | null | undefined}
     */
    getPreviewVideoLink () {
        const linkSelector = 'a[href^="/watch?v="]'
        const previewVideo = document.querySelector('#preview ' + linkSelector + ' video')

        return previewVideo?.closest(linkSelector)
    }

    /**
     * Append icon overlay to the video hover preview unless it's already been appended
     * @returns {HTMLElement|boolean}
     */
    appendIfNotAppended () {
        const previewVideo = this.getPreviewVideoLink()

        if (previewVideo) {
            return this.iconOverlay.appendToVideo(previewVideo)
        }

        return false
    }

    /**
     * Updates the icon overlay to use the correct video URL in the preview hover link whenever it is hovered
     */
    update () {
        const updateOverlayVideoId = (element) => {
            const overlay = element?.querySelector('.ddg-overlay')
            const href = element?.getAttribute('href')
            if (href) {
                const privateUrl = VideoParams.fromPathname(href)?.toPrivatePlayerUrl()
                if (overlay && privateUrl) {
                    overlay.querySelector('a.ddg-play-privately')?.setAttribute('href', privateUrl)
                }
            }
        }

        const videoElement = this.getPreviewVideoLink()

        updateOverlayVideoId(videoElement)
    }

    /**
     * YouTube does something weird to links added within ytd-app. Needs to set this up to
     * be able to make the preview link clickable.
     */
    fixLinkClick () {
        const previewLink = this.getPreviewVideoLink()?.querySelector('a.ddg-play-privately')
        if (!previewLink) return
        addTrustedEventListener(previewLink, 'click', () => {
            const href = previewLink?.getAttribute('href')
            if (href) {
                this.environment.setHref(href)
            }
        })
    }

    /**
     * Initiate the preview hover overlay
     */
    init () {
        const appended = this.appendIfNotAppended()

        if (appended) {
            this.fixLinkClick()
        } else {
            this.update()
        }
    }
}
