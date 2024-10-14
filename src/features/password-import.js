import ContentFeature from '../content-feature'
import { DDGProxy, DDGReflect, withExponentialBackoff } from '../utils'

const ANIMATION_DURATION_MS = 1000
const ANIMATION_ITERATIONS = Infinity

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
            duration: ANIMATION_DURATION_MS, // 1 second, should be configurable
            iterations: ANIMATION_ITERATIONS // Infinite, should be configurable
        }

        // Apply the animation to the element
        element.animate(keyframes, options)
    }

    autotapElement (element) {
        element.click()
    }

    async findExportElement () {
        const findInContainer = () => {
            const exportButtonContainer = document.querySelector(this.exportButtonContainerSelector)
            if (exportButtonContainer != null) {
                return exportButtonContainer.querySelectorAll('button')[1]
            }
            return null
        }

        const findWithLabel = () => {
            return document.querySelector(this.exportButtonLabelTextSelector)
        }

        await withExponentialBackoff(() => findInContainer() ?? findWithLabel())
    }

    async findSettingsElement () {
        const fn = () => {
            const settingsButton = document.querySelector(this.settingsButtonSelectors[0])
            if (settingsButton != null) {
                return settingsButton
            }
            return null
        }
        return await withExponentialBackoff(fn)
    }

    async findSignInButton () {
        return await withExponentialBackoff(() => document.querySelector(this.signinButtonSelectors[0]))
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

    get exportButtonContainerSelector () {
        return 'c-wiz[data-node-index*="2;0"], c-wiz[data-p*="options"]:nth-child(1), c-wiz[jsdata="deferred-i4"]'
        // return this.#exportButtonSettings?.containerSelectors?.join(',')
    }

    get exportButtonLabelTextSelector () {
        return this.#exportButtonSettings?.labelTexts
            .map(text => `button[arial-label="${text}"]`)
            .join(',')
    }

    get signinButtonSelectors () {
        return ['a[href*="ServiceLogin"]:not([target="_top"]']
    }

    get settingsButtonSelectors () {
        return ['a[href*="options"]']
    }

    setButtonSettings (settings) {
        this.#exportButtonSettings = settings?.exportButton
        this.#settingsButtonSettings = settings?.settingsButton
        this.#signInButtonSettings = settings?.signInButton
    }

    init (args) {
        this.setButtonSettings(args?.featureSettings?.passwordImport || {})

        // TODO: this is stolen from element-hiding.js, we would need a global util that would do this,
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
