import { appendElement, applyEffect, execCleanups } from './util'

export class VideoPlayerIcon {
    /**
     * @param {import("./icon-overlay.js").IconOverlay} iconOverlay
     */
    constructor (iconOverlay) {
        /** @type {{fn: () => void, name: string}[]} */
        this._cleanups = []
        this.iconOverlay = iconOverlay
    }

    /**
     * This will only get called once everytime a new video is loaded.
     *
     * @param {Element} containerElement
     * @param {import("./util").VideoParams} params
     */
    init (containerElement, params) {
        if (!containerElement) {
            console.error('missing container element')
            return
        }

        this.appendOverlay(containerElement, params)
    }

    /**
     * @param {Element} containerElement
     * @param {import("./util").VideoParams} params
     */
    appendOverlay (containerElement, params) {
        this.cleanup()
        const href = params.toPrivatePlayerUrl()
        const iconElement = this.iconOverlay.create('video-player', href, 'hidden')

        this.sideEffect('dax 🐥 icon overlay', () => {
            /**
             * Append the icon to the container element
             */
            appendElement(containerElement, iconElement)
            iconElement.classList.remove('hidden')

            return () => {
                if (iconElement.isConnected && containerElement?.contains(iconElement)) {
                    containerElement.removeChild(iconElement)
                }
            }
        })
    }

    /**
     * Wrap a side-effecting operation for easier debugging
     * and teardown/release of resources
     * @param {string} name
     * @param {() => () => void} fn
     */
    sideEffect (name, fn) {
        applyEffect(name, fn, this._cleanups)
    }

    /**
     * Remove elements, event listeners etc
     */
    cleanup () {
        execCleanups(this._cleanups)
        this._cleanups = []
    }
}
