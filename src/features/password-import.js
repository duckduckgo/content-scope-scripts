import ContentFeature from '../content-feature'
import { DDGProxy, DDGReflect } from '../utils'
import { getElement } from './broker-protection/utils'

const MAX_SEARCH_ATTEMPTS = 10
const INITIAL_ATTEMPT_DELAY = 500 // in ms

export default class PasswordImport extends ContentFeature {
    searchElements () {
        return new Promise((resolve, reject) => {
            const xpath = "//div[text()='Export passwords']/ancestor::li" // Should be configurable
            const exportElement = getElement(document, xpath)
            if (exportElement) {
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
                    resolve(exportElement)
                }
            } else {
                reject(new Error('Export passwords element not found'))
            }
        })
    }

    withExponentialBackoff (fn, maxAttempts = MAX_SEARCH_ATTEMPTS, delay = INITIAL_ATTEMPT_DELAY) {
        return new Promise((resolve, reject) => {
            const call = (attempt) => {
                try {
                    const result = fn()
                    resolve(result)
                } catch (error) {
                    if (attempt >= maxAttempts) {
                        reject(error)
                    } else {
                        setTimeout(() => call(attempt + 1), delay * 2 ** attempt)
                    }
                }
            }
            call(0)
        })
    }

    init () {
        const searchElements = this.searchElements.bind(this)
        const withExponentialBackoff = this.withExponentialBackoff.bind(this)
        // FIXME: this is stolen from element-hiding.js, we would need a global util that would do this,
        // single page applications don't have a DOMContentLoaded event on navigations, so
        // we use proxy/reflect on history.pushState to call applyRules on page navigations
        const historyMethodProxy = new DDGProxy(this, History.prototype, 'pushState', {
            apply (target, thisArg, args) {
                withExponentialBackoff(searchElements)
                return DDGReflect.apply(target, thisArg, args)
            }
        })
        historyMethodProxy.overload()
        // listen for popstate events in order to run on back/forward navigations
        window.addEventListener('popstate', () => {
            withExponentialBackoff(searchElements)
        })

        document.addEventListener('DOMContentLoaded', () => {
            withExponentialBackoff(searchElements)
        })
    }
}
