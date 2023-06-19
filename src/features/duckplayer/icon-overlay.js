import { addTrustedEventListener, appendElement, VideoParams } from './util'
import dax from './assets/dax.svg'
import { i18n } from './text.js'
import { OpenInDuckPlayerMsg } from './overlay-messages.js'
import { html, trustedUnsafe } from '../../dom-utils.js'
import { VideoThumbnail } from './video-thumbnail.js'
import css from './assets/styles.css'
import { Preview } from './preview.js'

export class IconOverlay {
    /**
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} comms
     */
    constructor (comms) {
        this.HOVER_CLASS = 'ddg-overlay-hover'
        this.OVERLAY_CLASS = 'ddg-overlay'
        this.CSS_OVERLAY_MARGIN_TOP = 5
        this.CSS_OVERLAY_HEIGHT = 32
        this.currentVideoElement = null
        this.hoverOverlayVisible = false
        this.comms = comms
    }

    create (size, href, extraClass) {
        const overlayElement = document.createElement('div')

        overlayElement.setAttribute('class', 'ddg-overlay' + (extraClass ? ' ' + extraClass : ''))
        overlayElement.setAttribute('data-size', size)
        const svgIcon = trustedUnsafe(dax)
        overlayElement.innerHTML = html`
            <a class="ddg-play-privately" href="#">
                <div class="ddg-dax">
                ${svgIcon}
                </div>
                <div class="ddg-play-text-container">
                    <div class="ddg-play-text">
                        ${i18n.t('playText')}
                    </div>
                </div>
            </a>`.toString()

        overlayElement.querySelector('a.ddg-play-privately')?.setAttribute('href', href)
        overlayElement.querySelector('a.ddg-play-privately')?.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()

            // @ts-expect-error - needs a cast
            const link = event.target.closest('a')
            const href = link.getAttribute('href')

            this.comms?.openDuckPlayer(new OpenInDuckPlayerMsg({ href }))
        })

        return overlayElement
    }

    getHoverOverlay () {
        return document.querySelector('.' + this.HOVER_CLASS)
    }

    moveHoverOverlayToVideoElement (videoElement) {
        const overlay = this.getHoverOverlay()

        if (overlay === null || this.videoScrolledOutOfViewInPlaylist(videoElement)) {
            return
        }

        const videoElementOffset = this.getElementOffset(videoElement)

        overlay.setAttribute(
            'style',
            'top: ' + videoElementOffset.top + 'px;' +
            'left: ' + videoElementOffset.left + 'px;' +
            'display:block;'
        )

        overlay.setAttribute('data-size', 'fixed ' + this.getThumbnailSize(videoElement))

        const href = videoElement.getAttribute('href')

        if (href) {
            const privateUrl = VideoParams.fromPathname(href)?.toPrivatePlayerUrl()
            if (overlay && privateUrl) {
                overlay.querySelector('a')?.setAttribute('href', privateUrl)
            }
        }

        this.hoverOverlayVisible = true
        this.currentVideoElement = videoElement
    }

    videoScrolledOutOfViewInPlaylist (videoElement) {
        const inPlaylist = videoElement.closest('#items.playlist-items')

        if (inPlaylist) {
            const video = videoElement.getBoundingClientRect()
            const playlist = inPlaylist.getBoundingClientRect()

            const videoOutsideTop = (video.top + this.CSS_OVERLAY_MARGIN_TOP) < playlist.top
            const videoOutsideBottom = ((video.top + this.CSS_OVERLAY_HEIGHT + this.CSS_OVERLAY_MARGIN_TOP) > playlist.bottom)

            if (videoOutsideTop || videoOutsideBottom) {
                return true
            }
        }

        return false
    }

    getElementOffset (el) {
        const box = el.getBoundingClientRect()
        const docElem = document.documentElement
        return {
            top: box.top + window.pageYOffset - docElem.clientTop,
            left: box.left + window.pageXOffset - docElem.clientLeft
        }
    }

    repositionHoverOverlay () {
        if (this.currentVideoElement && this.hoverOverlayVisible) {
            this.moveHoverOverlayToVideoElement(this.currentVideoElement)
        }
    }

    hidePlaylistOverlayOnScroll (e) {
        if (e?.target?.id === 'items') {
            const overlay = this.getHoverOverlay()
            if (overlay) {
                this.hideOverlay(overlay)
            }
        }
    }

    hideHoverOverlay (event, force) {
        const overlay = this.getHoverOverlay()
        const toElement = event.toElement

        if (overlay) {
            if (toElement === overlay || overlay.contains(toElement) || force) {
                return
            }

            this.hideOverlay(overlay)
            this.hoverOverlayVisible = false
        }
    }

    hideOverlay (overlay) {
        overlay.setAttribute('style', 'display:none;')
    }

    appendHoverOverlay () {
        const el = this.create('fixed', '', this.HOVER_CLASS)
        appendElement(document.body, el)

        addTrustedEventListener(document.body, 'mouseup', (event) => {
            this.hideHoverOverlay(event)
        })
    }

    appendToVideo (videoElement) {
        const appendOverlayToThumbnail = (videoElement) => {
            if (videoElement) {
                const privateUrl = VideoParams.fromHref(videoElement.href)?.toPrivatePlayerUrl()
                const thumbSize = this.getThumbnailSize(videoElement)
                if (privateUrl) {
                    appendElement(videoElement, this.create(thumbSize, privateUrl))
                    videoElement.classList.add('has-dgg-overlay')
                }
            }
        }

        const videoElementAlreadyHasOverlay = videoElement && videoElement.querySelector('div[class="ddg-overlay"]')

        if (!videoElementAlreadyHasOverlay) {
            appendOverlayToThumbnail(videoElement)
            return true
        }

        return false
    }

    getThumbnailSize (videoElement) {
        const imagesByArea = {}

        Array.from(videoElement.querySelectorAll('img')).forEach(image => {
            imagesByArea[(image.offsetWidth * image.offsetHeight)] = image
        })

        const largestImage = Math.max.apply(this, Object.keys(imagesByArea).map(Number))

        const getSizeType = (width, height) => {
            if (width < (123 + 10)) {
                return 'small'
            } else if (width < 300 && height < 175) {
                return 'medium'
            } else {
                return 'large'
            }
        }

        return getSizeType(imagesByArea[largestImage].offsetWidth, imagesByArea[largestImage].offsetHeight)
    }

    removeAll () {
        document.querySelectorAll('.' + this.OVERLAY_CLASS).forEach(element => {
            element.remove()
        })
    }
}

export class AllIconOverlays {
    /**
     * @param {import("./yt-overlays.js").Environment} environment
     * @param {import("./util.js").DomState} domState
     * @param {import("./video-overlay-manager.js").VideoOverlayManager} videoPlayerOverlay
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} comms
     */
    constructor (environment, domState, videoPlayerOverlay, comms) {
        this.enabled = false
        this.hasBeenEnabled = false
        this.environment = environment
        this.domState = domState
        this.videoPlayerOverlay = videoPlayerOverlay
        this.comms = comms
        this.overlays = new IconOverlay(this.comms)
        this.preview = new Preview(environment, this.overlays)
        this.thumbs = new VideoThumbnail(this.overlays)
    }

    start () {
        this.domState.onLoaded(() => {
            this.enable()
        })
    }

    enable () {
        if (!this.hasBeenEnabled) {
            const style = document.createElement('style')
            style.textContent = css
            appendElement(document.head, style)

            this.domState.onChanged(() => {
                if (this.enabled) {
                    this.thumbs.bindEventsToAll()
                    this.preview.init()
                }

                this.videoPlayerOverlay.watchForVideoBeingAdded({ via: 'mutation observer' })
            })

            window.addEventListener('resize', () => this.overlays.repositionHoverOverlay())

            window.addEventListener('scroll', (e) => this.overlays.hidePlaylistOverlayOnScroll(e), true)
        }

        this.overlays.appendHoverOverlay()
        this.thumbs.bindEventsToAll()

        this.enabled = true
        this.hasBeenEnabled = true
    }

    disable () {
        this.enabled = false
        this.overlays.removeAll()
    }
}
