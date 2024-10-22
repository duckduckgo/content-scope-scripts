import ContentFeature from '../content-feature'
import { DDGProxy, DDGReflect, withExponentialBackoff } from '../utils'

const ANIMATION_DURATION_MS = 1000
const ANIMATION_ITERATIONS = Infinity

export default class PasswordImport extends ContentFeature {
    #exportButtonSettings
    #settingsButtonSettings
    #signInButtonSettings

    /**
     * @param {string} path
     * @returns {Promise<{element: HTMLElement|Element, style: any, shouldTap: boolean}|null>}
     */
    async getElementAndStyleFromPath (path) {
        if (path === '/') {
            const element = await this.findSettingsElement()
            return element != null
                ? {
                    style: {
                        scale: 1,
                        backgroundColor: 'rgba(0, 39, 142, 0.5)'
                    },
                    element,
                    shouldTap: this.#settingsButtonSettings.shouldAutotap ?? false
                }
                : null
        } else if (path === '/options') {
            const element = await this.findExportElement()
            return element != null
                ? {
                    style: {
                        scale: 1.01,
                        backgroundColor: 'rgba(0, 39, 142, 0.5)'
                    },
                    element,
                    shouldTap: this.#exportButtonSettings.shouldAutotap ?? false
                }
                : null
        } else if (path === '/intro') {
            const element = await this.findSignInButton()
            return element != null
                ? {
                    style: {
                        scale: 1.5,
                        backgroundColor: 'rgba(0, 39, 142, 0.5)'
                    },
                    element,
                    shouldTap: this.#signInButtonSettings.shouldAutotap ?? false
                }
                : null
        } else {
            return null
        }
    }

    /**
     *
     * @param {HTMLElement|Element} element
     * @param {any} style
     */
    animateElement (element, style) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        }) // Scroll into view
        const keyframes = [
            { backgroundColor: 'rgba(0, 0, 255, 0)', offset: 0, borderRadius: '2px' }, // Start: transparent
            { backgroundColor: style.backgroundColor, offset: 0.5, borderRadius: '2px', transform: `scale(${style.scale})` }, // Midpoint: blue with 50% opacity
            { backgroundColor: 'rgba(0, 0, 255, 0)', borderRadius: '2px', offset: 1 } // End: transparent
        ]

        // Define the animation options
        const options = {
            duration: ANIMATION_DURATION_MS,
            iterations: ANIMATION_ITERATIONS
        }

        // Apply the animation to the element
        element.animate(keyframes, options)
    }

    autotapElement (element) {
        element.click()
    }

    /**
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
     *
     * @param {string} path
     */
    async handleElementForPath (path) {
        // FIXME: we need to check if the path is supported, otherwise
        // for some reason google doesn't wait to proceed with the signin step.
        // Not too sure why this is happening, there are no errors on the console.

        if ([this.#exportButtonSettings.path, this.#settingsButtonSettings.path, this.#signInButtonSettings.path].indexOf(path) !== -1) {
            try {
                const { element, style, shouldTap } = await this.getElementAndStyleFromPath(path) ?? {}
                if (element != null) {
                    shouldTap ? this.autotapElement(element) : this.animateElement(element, style)
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

    /**
     * @param {any} settings
     */
    setButtonSettings (settings) {
        this.#exportButtonSettings = settings?.exportButton
        this.#settingsButtonSettings = settings?.settingsButton
        this.#signInButtonSettings = settings?.signInButton
    }

    init (args) {
        this.setButtonSettings(args?.featureSettings?.passwordImport || {})

        const handleElementForPath = this.handleElementForPath.bind(this)
        const historyMethodProxy = new DDGProxy(this, History.prototype, 'pushState', {
            async apply (target, thisArg, args) {
                const path = args[1]
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
