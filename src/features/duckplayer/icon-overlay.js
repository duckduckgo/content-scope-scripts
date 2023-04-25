import { addTrustedEventListener, appendElement, VideoParams } from './util'
import dax from './assets/dax.svg'
import { i18n } from './text.js'
import { OpenInDuckPlayerMsg } from './overlay-messages.js'
import { html, trustedUnsafe } from '../../dom-utils.js'

export const IconOverlay = {
    /**
     * Special class used for the overlay hover. For hovering, we use a
     * single element and move it around to the hovered video element.
     */
    HOVER_CLASS: 'ddg-overlay-hover',
    OVERLAY_CLASS: 'ddg-overlay',

    CSS_OVERLAY_MARGIN_TOP: 5,
    CSS_OVERLAY_HEIGHT: 32,

    /** @type {HTMLElement | null} */
    currentVideoElement: null,
    hoverOverlayVisible: false,

    /**
     * @type {import("./overlay-messages.js").DuckPlayerOverlayMessages | null}
     */
    comms: null,
    /**
     * // todo: when this is a class, pass this as a constructor arg
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} comms
     */
    setComms (comms) {
        IconOverlay.comms = comms
    },
    /**
     * Creates an Icon Overlay.
     * @param {string} size - currently kind-of unused
     * @param {string} href - what, if any, href to set the link to by default.
     * @param {string} [extraClass] - whether to add any extra classes, such as hover
     * @returns {HTMLElement}
     */
    create: (size, href, extraClass) => {
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

            IconOverlay.comms?.openInDuckPlayerViaMessage(new OpenInDuckPlayerMsg({ href }))
        })

        return overlayElement
    },

    /**
     * Util to return the hover overlay
     * @returns {HTMLElement | null}
     */
    getHoverOverlay: () => {
        return document.querySelector('.' + IconOverlay.HOVER_CLASS)
    },

    /**
     * Moves the hover overlay to a specified videoElement
     * @param {HTMLElement} videoElement - which element to move it to
     */
    moveHoverOverlayToVideoElement: (videoElement) => {
        const overlay = IconOverlay.getHoverOverlay()

        if (overlay === null || IconOverlay.videoScrolledOutOfViewInPlaylist(videoElement)) {
            return
        }

        const videoElementOffset = IconOverlay.getElementOffset(videoElement)

        overlay.setAttribute('style', '' +
            'top: ' + videoElementOffset.top + 'px;' +
            'left: ' + videoElementOffset.left + 'px;' +
            'display:block;'
        )

        overlay.setAttribute('data-size', 'fixed ' + IconOverlay.getThumbnailSize(videoElement))

        const href = videoElement.getAttribute('href')

        if (href) {
            const privateUrl = VideoParams.fromPathname(href)?.toPrivatePlayerUrl()
            if (overlay && privateUrl) {
                overlay.querySelector('a')?.setAttribute('href', privateUrl)
            }
        }

        IconOverlay.hoverOverlayVisible = true
        IconOverlay.currentVideoElement = videoElement
    },

    /**
     * Returns true if the videoElement is scrolled out of view in a playlist. (In these cases
     * we don't want to show the overlay.)
     * @param {HTMLElement} videoElement
     * @returns {boolean}
     */
    videoScrolledOutOfViewInPlaylist: (videoElement) => {
        const inPlaylist = videoElement.closest('#items.playlist-items')

        if (inPlaylist) {
            const video = videoElement.getBoundingClientRect()
            const playlist = inPlaylist.getBoundingClientRect()

            const videoOutsideTop = (video.top + IconOverlay.CSS_OVERLAY_MARGIN_TOP) < playlist.top
            const videoOutsideBottom = ((video.top + IconOverlay.CSS_OVERLAY_HEIGHT + IconOverlay.CSS_OVERLAY_MARGIN_TOP) > playlist.bottom)

            if (videoOutsideTop || videoOutsideBottom) {
                return true
            }
        }

        return false
    },

    /**
     * Return the offset of an HTML Element
     * @param {HTMLElement} el
     * @returns {Object}
     */
    getElementOffset: (el) => {
        const box = el.getBoundingClientRect()
        const docElem = document.documentElement
        return {
            top: box.top + window.pageYOffset - docElem.clientTop,
            left: box.left + window.pageXOffset - docElem.clientLeft
        }
    },

    /**
     * Reposition the hover overlay on top of the current video element (in case
     * of window resize if the hover overlay is visible)
     */
    repositionHoverOverlay: () => {
        if (IconOverlay.currentVideoElement && IconOverlay.hoverOverlayVisible) {
            IconOverlay.moveHoverOverlayToVideoElement(IconOverlay.currentVideoElement)
        }
    },

    /**
     * The IconOverlay is absolutely positioned and at the end of the body tag. This means that if its placed in
     * a scrollable playlist, it will "float" above the playlist on scroll.
     */
    hidePlaylistOverlayOnScroll: (e) => {
        if (e?.target?.id === 'items') {
            const overlay = IconOverlay.getHoverOverlay()
            if (overlay) {
                IconOverlay.hideOverlay(overlay)
            }
        }
    },

    /**
     * Hides the hover overlay element, but only if mouse pointer is outside of the hover overlay element
     */
    hideHoverOverlay: (event, force) => {
        const overlay = IconOverlay.getHoverOverlay()

        const toElement = event.toElement

        if (overlay) {
            // Prevent hiding overlay if mouseleave is triggered by user is actually hovering it and that
            // triggered the mouseleave event
            if (toElement === overlay || overlay.contains(toElement) || force) {
                return
            }

            IconOverlay.hideOverlay(overlay)
            IconOverlay.hoverOverlayVisible = false
        }
    },

    /**
     * Util for hiding an overlay
     * @param {HTMLElement} overlay
     */
    hideOverlay: (overlay) => {
        overlay.setAttribute('style', 'display:none;')
    },

    /**
     * Appends the Hover Overlay to the page. This is the one that is shown on hover of any video thumbnail.
     * More performant / clean than adding an overlay to each and every video thumbnail. Also it prevents triggering
     * the video hover preview on the homepage if the user hovers the overlay, because user is no longer hovering
     * inside a video thumbnail when hovering the overlay. Nice.
     */
    appendHoverOverlay: () => {
        const el = IconOverlay.create('fixed', '', IconOverlay.HOVER_CLASS)
        appendElement(document.body, el)

        // Hide it if user clicks anywhere on the page but in the icon overlay itself
        addTrustedEventListener(document.body, 'mouseup', (event) => {
            IconOverlay.hideHoverOverlay(event)
        })
    },

    /**
     * Appends an overlay (currently just used for the video hover preview)
     * @param {HTMLElement} videoElement - to append to
     * @returns {boolean} - whether the overlay was appended or not
     */
    appendToVideo: (videoElement) => {
        const appendOverlayToThumbnail = (videoElement) => {
            if (videoElement) {
                const privateUrl = VideoParams.fromHref(videoElement.href)?.toPrivatePlayerUrl()
                const thumbSize = IconOverlay.getThumbnailSize(videoElement)
                if (privateUrl) {
                    appendElement(videoElement, IconOverlay.create(thumbSize, privateUrl))
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
    },

    getThumbnailSize: (videoElement) => {
        const imagesByArea = {}

        Array.from(videoElement.querySelectorAll('img')).forEach(image => {
            imagesByArea[(image.offsetWidth * image.offsetHeight)] = image
        })

        const largestImage = Math.max.apply(this, Object.keys(imagesByArea).map(Number))

        const getSizeType = (width, height) => {
            if (width < (123 + 10)) { // match CSS: width of expanded overlay + twice the left margin.
                return 'small'
            } else if (width < 300 && height < 175) {
                return 'medium'
            } else {
                return 'large'
            }
        }

        return getSizeType(imagesByArea[largestImage].offsetWidth, imagesByArea[largestImage].offsetHeight)
    },

    removeAll: () => {
        document.querySelectorAll('.' + IconOverlay.OVERLAY_CLASS).forEach(element => {
            element.remove()
        })
    }
}
