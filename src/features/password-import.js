import ContentFeature from '../content-feature'
import { DDGProxy, DDGReflect, withExponentialBackoff } from '../utils'
import { getElement } from './broker-protection/utils'

export default class PasswordImport extends ContentFeature {
    #exportButtonSettings = {}
    #settingsButtonSettings = {}
    #signInButtonSettings = {}

    async getElementAndStyleFromPath (path) {
        if (path === '/') {
            return {
                style: {
                    scale: 1,
                    backgroundColor: 'rgba(0, 39, 142, 0.5)'
                },
                element: await this.findSettingsElement(),
                shouldTap: this.#settingsButtonSettings.autotap?.enabled ?? false
            }
        } else if (path === '/options') {
            return {
                style: {
                    scale: 1.01,
                    backgroundColor: 'rgba(0, 39, 142, 0.5)'
                },
                element: await this.findExportElement(),
                shouldTap: this.#exportButtonSettings.autotap?.enabled ?? false
            }
        } else if (path === '/intro') {
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
            { backgroundColor: 'rgba(0, 0, 255, 0)', offset: 0, borderRadus: '2px' }, // Start: transparent
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
        return await withExponentialBackoff(() => getElement(document, this.exportButtonSelector))
    }

    async findSettingsElement () {
        return await withExponentialBackoff(() => document.querySelector(this.settingsButtonSelector))
    }

    async findSignInButton () {
        return await withExponentialBackoff(() => document.querySelector(this.signinButtonSelector))
    }

    async handleElementForPath (path) {
        const animateElement = this.animateElement.bind(this)
        const { element, style, shouldTap } = await this.getElementAndStyleFromPath(path) ?? {}
        if (element != null) {
            shouldTap ? this.autotapElement() : animateElement(element, style)
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
        return '[aria-label="Export"]'
        // if (this.exportButtonAnimationType === 'autotap') {
        //     return this.#exportButtonSettings.autotap?.xpath
        // } else if (this.exportButtonAnimationType === 'highlight') {
        //     return this.#exportButtonSettings.highlight?.xpath
        // } else {
        //     return null
        // }
    }

    get signinButtonSelector () {
        return '[aria-label="Sign in"]:not([target="_top"])'
        // if (this.exportButtonAnimationType === 'autotap') {
        //     return this.#signInButtonSettings.autotap?.selector
        // } else if (this.exportButtonAnimationType === 'highlight') {
        //     return this.#signInButtonSettings.highlight?.selector
        // } else {
        //     return null
        // }
    }

    get settingsButtonSelector () {
        return '[aria-label=\'Password options\']'
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
