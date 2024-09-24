import ContentFeature from '../content-feature'
import { DDGProxy, DDGReflect } from '../utils'
import { getElement } from './broker-protection/utils'

export default class PasswordImport extends ContentFeature {
    searchElements () {
        const xpath = "//div[text()='Export passwords']/ancestor::li" // Should be configurable
        const exportElement = getElement(document, xpath)
        if (exportElement) {
            exportElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            }) // Scroll into view
            const keyframes = [
                { backgroundColor: 'transparent' },
                { backgroundColor: 'lightblue' },
                { backgroundColor: 'transparent' }
            ]

            // Define the animation options
            const options = {
                duration: 1000, // 1 seconds, should be configurable
                iterations: 3 // Max 3 blinks, should be configurable
            }

            // Apply the animation to the element
            exportElement.animate(keyframes, options)
        }
    }

    init () {
        const searchElements = this.searchElements.bind(this)
        // FIXME: this is stolen from element-hiding.js, we would need a global util that would do this,
        // single page applications don't have a DOMContentLoaded event on navigations, so
        // we use proxy/reflect on history.pushState to call applyRules on page navigations
        const historyMethodProxy = new DDGProxy(this, History.prototype, 'pushState', {
            apply (target, thisArg, args) {
                searchElements()
                return DDGReflect.apply(target, thisArg, args)
            }
        })
        historyMethodProxy.overload()
        // listen for popstate events in order to run on back/forward navigations
        window.addEventListener('popstate', () => {
            searchElements()
        })

        document.addEventListener('DOMContentLoaded', () => {
            searchElements()
        })
    }
}
