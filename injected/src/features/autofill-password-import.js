import ContentFeature from '../content-feature'
import { DDGProxy, DDGReflect, withExponentialBackoff } from '../utils'

const ANIMATION_DURATION_MS = 1000
const ANIMATION_ITERATIONS = Infinity
const BACKGROUND_COLOR_START = 'rgba(85, 127, 243, 0.10)'
const BACKGROUND_COLOR_END = 'rgba(85, 127, 243, 0.25)'

/**
 * This feature is responsible for animating some buttons passwords.google.com,
 * during a password import flow. The overall approach is:
 * 1. Check if the path is supported,
 * 2. Find the element to animate based on the path - using structural selectors first and then fallback to label texts),
 * 3. Animate the element, or tap it if it should be autotapped.
 */
export default class AutofillPasswordImport extends ContentFeature {
    #exportButtonSettings
    #settingsButtonSettings
    #signInButtonSettings

    /**
     * @returns {any}
     */
    get settingsButtonStyle () {
        return {
            transform: {
                start: 'scale(0.90)',
                mid: 'scale(0.96)'
            },
            borderRadius: '100%',
            offsetLeft: 0,
            offsetTop: 0
        }
    }

    /**
     * @returns {any}
     */
    get exportButtonStyle () {
        return {
            transform: {
                start: 'scale(1)',
                mid: 'scale(1.01)'
            },
            borderRadius: '100%',
            offsetLeft: 0,
            offsetTop: 0
        }
    }

    /**
     * @returns {any}
     */
    get signInButtonStyle () {
        return {
            transform: {
                start: 'scale(1)',
                mid: 'scale(1.3, 1.5)'
            },
            borderRadius: '2px',
            offsetLeft: 1.30,
            offsetTop: 0.15
        }
    }

    /**
     * Takes a path and returns the element and style to animate.
     * @param {string} path
     * @returns {Promise<{element: HTMLElement|Element, style: any, shouldTap: boolean}|null>}
     */
    async getElementAndStyleFromPath (path) {
        if (path === '/') {
            const element = await this.findSettingsElement()
            return element != null
                ? {
                    style: this.settingsButtonStyle,
                    element,
                    shouldTap: this.#settingsButtonSettings?.shouldAutotap ?? false
                }
                : null
        } else if (path === '/options') {
            const element = await this.findExportElement()
            return element != null
                ? {
                    style: this.exportButtonStyle,
                    element,
                    shouldTap: this.#exportButtonSettings?.shouldAutotap ?? false
                }
                : null
        } else if (path === '/intro') {
            const element = await this.findSignInButton()
            return element != null
                ? {
                    style: this.signInButtonStyle,
                    element,
                    shouldTap: this.#signInButtonSettings?.shouldAutotap ?? false
                }
                : null
        } else {
            return null
        }
    }

    insertOverlayElement (mainElement, offsetLeft, offsetTop) {
        const overlay = document.createElement('div')
        overlay.style.position = 'absolute'

        // FIXME: Workaround for the overlay not being positioned correctly
        overlay.style.top = `${mainElement.offsetTop - offsetTop}px`
        overlay.style.left = `${mainElement.offsetLeft - offsetLeft}px`
        const dimensions = mainElement.getBoundingClientRect()
        overlay.style.width = `${dimensions.width}px`
        overlay.style.height = `${dimensions.height}px`

        // Ensure overlay is non-interactive
        overlay.style.pointerEvents = 'none'

        // Ensure that the element is injected before the parent to avoid z-index issues
        mainElement.parentNode.insertBefore(overlay, mainElement.nextSibling)
        return overlay
    }

    /**
     * Moves the element into view and animates it.
     * @param {HTMLElement|Element} element
     * @param {any} style
     */
    animateElement (element, style) {
        const overlay = this.insertOverlayElement(element, style.offsetLeft, style.offsetTop)
        overlay.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        }) // Scroll into view
        const keyframes = [
            { backgroundColor: BACKGROUND_COLOR_START, offset: 0, borderRadius: style.borderRadius, border: `1px solid ${BACKGROUND_COLOR_START}`, transform: style.transform.start }, // Start: 10% blue
            { backgroundColor: BACKGROUND_COLOR_END, offset: 0.5, borderRadius: style.borderRadius, border: `1px solid ${BACKGROUND_COLOR_END}`, transform: style.transform.mid, transformOrigin: 'center' }, // Middle: 25% blue
            { backgroundColor: BACKGROUND_COLOR_START, offset: 1, borderRadius: style.borderRadius, border: `1px solid ${BACKGROUND_COLOR_START}`, transform: style.transform.start } // End: 10% blue
        ]

        // Define the animation options
        const options = {
            duration: ANIMATION_DURATION_MS,
            iterations: ANIMATION_ITERATIONS
        }

        // Apply the animation to the element
        overlay.animate(keyframes, options)
    }

    autotapElement (element) {
        element.click()
    }

    /**
     * On passwords.google.com the export button is in a container that is quite ambiguious.
     * To solve for that we first try to find the container and then the button inside it.
     * If that fails, we look for the button based on it's label.
     * @returns {Promise<HTMLElement|Element|null>}
     */
    async findExportElement () {
        const findInContainer = () => {
            const exportButtonContainer = document.querySelector(this.exportButtonContainerSelector)
            return exportButtonContainer && exportButtonContainer.querySelectorAll('button')[1]
        }

        const findWithLabel = () => {
            return document.querySelector(this.exportButtonLabelTextSelector)
        }

        return await withExponentialBackoff(() => findInContainer() ?? findWithLabel())
    }

    /**
     * @returns {Promise<HTMLElement|Element|null>}
     */
    async findSettingsElement () {
        const fn = () => {
            const settingsButton = document.querySelector(this.settingsButtonSelector)
            return settingsButton
        }
        return await withExponentialBackoff(fn)
    }

    /**
     * @returns {Promise<HTMLElement|Element|null>}
     */
    async findSignInButton () {
        return await withExponentialBackoff(() => document.querySelector(this.signinButtonSelector))
    }

    /**
     * Checks if the path is supported and animates/taps the element if it is.
     * @param {string} path
     */
    async handleElementForPath (path) {
        const supportedPaths = [
            this.#exportButtonSettings?.path,
            this.#settingsButtonSettings?.path,
            this.#signInButtonSettings?.path
        ]
        if (supportedPaths.includes(path)) {
            try {
                const { element, style, shouldTap } = await this.getElementAndStyleFromPath(path) ?? {}
                if (element != null) {
                    shouldTap ? this.autotapElement(element) : setTimeout(() => this.animateElement(element, style), 300)
                }
            } catch {
                console.error('password-import: handleElementForPath failed for path:', path)
            }
        }
    }

    /**
     * @returns {string}
     */
    get exportButtonContainerSelector () {
        return this.#exportButtonSettings?.selectors?.join(',')
    }

    /**
     * @returns {string}
     */
    get exportButtonLabelTextSelector () {
        return this.#exportButtonSettings?.labelTexts
            .map(text => `button[aria-label="${text}"]`)
            .join(',')
    }

    /**
     * @returns {string}
     */
    get signinLabelTextSelector () {
        return this.#signInButtonSettings?.labelTexts
            .map(text => `a[aria-label="${text}"]:not([target="_top"])`)
            .join(',')
    }

    /**
     * @returns {string}
     */
    get signinButtonSelector () {
        return `${this.#signInButtonSettings?.selectors?.join(',')}, ${this.signinLabelTextSelector}`
    }

    /**
     * @returns {string}
     */
    get settingsLabelTextSelector () {
        return this.#settingsButtonSettings?.labelTexts
            .map(text => `a[aria-label="${text}"]`)
            .join(',')
    }

    /**
     * @returns {string}
     */
    get settingsButtonSelector () {
        return `${this.#settingsButtonSettings?.selectors?.join(',')}, ${this.settingsLabelTextSelector}`
    }

    setButtonSettings () {
        this.#exportButtonSettings = this.getFeatureSetting('exportButton')
        this.#signInButtonSettings = this.getFeatureSetting('signInButton')
        this.#settingsButtonSettings = this.getFeatureSetting('settingsButton')
    }

    init () {
        this.setButtonSettings()

        const handleElementForPath = this.handleElementForPath.bind(this)
        const historyMethodProxy = new DDGProxy(this, History.prototype, 'pushState', {
            async apply (target, thisArg, args) {
                const path = args[1] === '' ? args[2].split('?')[0] : args[1]
                await handleElementForPath(path)
                return DDGReflect.apply(target, thisArg, args)
            }
        })
        historyMethodProxy.overload()
        // listen for popstate events in order to run on back/forward navigations
        window.addEventListener('popstate', async () => {
            await handleElementForPath(window.location.pathname)
        })

        document.addEventListener('DOMContentLoaded', async () => {
            await handleElementForPath(window.location.pathname)
        })
    }
}
