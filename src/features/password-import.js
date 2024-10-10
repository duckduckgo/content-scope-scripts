import ContentFeature from '../content-feature'
import { DDGProxy, DDGReflect, withExponentialBackoff } from '../utils'

export default class PasswordImport extends ContentFeature {
    #exportButtonSettings = {}
    #settingsButtonSettings = {}
    #signInButtonSettings = {}

    SUPPORTED_PATHS = {
        SIGNIN: '/intro',
        EXPORT: '/options',
        SETTINGS: '/'
    }

    async getElementAndStyleFromPath (path) {
        if (path === this.SUPPORTED_PATHS.SETTINGS) {
            return {
                style: {
                    scale: 1,
                    backgroundColor: 'rgba(0, 39, 142, 0.5)'
                },
                element: await this.findSettingsElement(),
                shouldTap: this.#settingsButtonSettings.autotap?.enabled ?? false
            }
        } else if (path === this.SUPPORTED_PATHS.EXPORT) {
            return {
                style: {
                    scale: 1.01,
                    backgroundColor: 'rgba(0, 39, 142, 0.5)'
                },
                element: await this.findExportElement(),
                shouldTap: this.#exportButtonSettings.autotap?.enabled ?? false
            }
        } else if (path === this.SUPPORTED_PATHS.SIGNIN) {
            return {
                style: {
                    scale: 1.5,
                    backgroundColor: 'rgba(0, 39, 142, 0.5)'
                },
                element: await this.findSignInButton(),
                shouldTap: this.#signInButtonSettings.autotap?.enabled ?? false
            }
        } else {
            return null
        }
    }

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
            duration: 1000, // 1 second, should be configurable
            iterations: Infinity
        }

        // Apply the animation to the element
        element.animate(keyframes, options)
    }

    autotapElement (element) {
        element.click()
    }

    async findExportElement () {
        return await withExponentialBackoff(() => document
            .querySelectorAll(this.exportButtonSelector)[2]
            .querySelectorAll('button')[1])
    }

    async findSettingsElement () {
        return await withExponentialBackoff(() => document.querySelector(this.settingsButtonSelector))
    }

    async findSignInButton () {
        return await withExponentialBackoff(() => document.querySelector(this.signinButtonSelector))
    }

    async handleElementForPath (path) {
        // FIXME: This is a workaround, we need to check if the path is supported, otherwise
        // for some reason google doesn't wait to proceed with the signin step.
        // Not too sure why this is happening, there are no errors on the console.

        if (Object.values(this.SUPPORTED_PATHS).includes(path)) {
            const { element, style, shouldTap } = await this.getElementAndStyleFromPath(path) ?? {}
            if (element != null) {
                shouldTap ? this.autotapElement(element) : this.animateElement(element, style)
            }
        }
    }

    get exportButtonAnimationType () {
        return this.#exportButtonSettings.autotap?.enabled
            ? 'autotap'
            : this.#exportButtonSettings.highlight?.enabled
                ? 'highlight'
                : null
    }

    get exportButtonSelector () {
        return 'c-wiz[data-p*="options"]'
        // return '[aria-label="Export"]'
        // if (this.exportButtonAnimationType === 'autotap') {
        //     return this.#exportButtonSettings.autotap?.xpath
        // } else if (this.exportButtonAnimationType === 'highlight') {
        //     return this.#exportButtonSettings.highlight?.xpath
        // } else {
        //     return null
        // }
    }

    get signinButtonSelector () {
        return 'a[href*="ServiceLogin"]:not([target="_top"]'
        // if (this.exportButtonAnimationType === 'autotap') {
        //     return this.#signInButtonSettings.autotap?.selector
        // } else if (this.exportButtonAnimationType === 'highlight') {
        //     return this.#signInButtonSettings.highlight?.selector
        // } else {
        //     return null
        // }
    }

    get settingsButtonSelector () {
        return 'a[href*="options"]'
        // if (this.exportButtonAnimationType === 'autotap') {
        //     return this.#settingsButtonSettings.autotap?.selector
        // } else if (this.exportButtonAnimationType === 'highlight') {
        //     return this.#settingsButtonSettings.highlight?.selector
        // } else {
        //     return null
        // }
    }

    setButtonSettings (settings) {
        this.#exportButtonSettings = settings?.exportButton
        this.#settingsButtonSettings = settings?.settingsButton
        this.#signInButtonSettings = settings?.signInButton
    }

    init (args) {
        this.setButtonSettings(args?.featureSettings?.passwordImport || {})

        // FIXME: this is stolen from element-hiding.js, we would need a global util that would do this,
        // single page applications don't have a DOMContentLoaded event on navigations, so
        // we use proxy/reflect on history.pushState to find elements on page navigations
        const handleElementForPath = this.handleElementForPath.bind(this)
        const historyMethodProxy = new DDGProxy(this, History.prototype, 'pushState', {
            async apply (target, thisArg, args) {
                const path = args[2].split('?')[0]
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
