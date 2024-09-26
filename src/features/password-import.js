import ContentFeature from '../content-feature'
import { DDGProxy, DDGReflect, withExponentialBackoff } from '../utils'
import { getElement } from './broker-protection/utils'


const URL_ELEMENT_MAP = {
    '/': {
        name: 'cogWheel',
        style: {
            scale: 1,
            backgroundColor: 'rgba(0, 39, 142, 0.5)'
        }
    },
    '/options': {
        name: 'exportButton', 
        style: {
            scale: 1.01,
            backgroundColor: 'rgba(0, 39, 142, 0.5)'
        }
    },
    '/intro': {
        name: 'signInButton', 
        style: {
            scale: 1.5,
            backgroundColor: 'rgba(0, 39, 142, 0.3)'
        },
    }
}

export default class PasswordImport extends ContentFeature {
    findExportElement () {
        const xpath = "//div[text()='Export passwords']/ancestor::li" // Should be configurable
        return getElement(document, xpath)
    }

    animateElement (element, style) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        }) // Scroll into view
        const keyframes = [
            { backgroundColor: 'rgba(0, 0, 255, 0)', offset: 0 },  // Start: transparent
            { backgroundColor:  style.backgroundColor, offset: 0.5, transform: `scale(${style.scale})` },  // Midpoint: blue with 50% opacity
            { backgroundColor: 'rgba(0, 0, 255, 0)', offset: 1 }   // End: transparent
        ]

        // Define the animation options
        const options = {
            duration: 1000, // 1 second, should be configurable
            iterations: Infinity
        }

        // Apply the animation to the element
        element.animate(keyframes, options)
    }

    findSettingsElement () {
        return document.querySelector('[aria-label=\'Password options\']')
    }

    findSignInButton () {
        return document.querySelector('[aria-label="Sign in"]:not([target="_top"])');
    }

    async findElement (name) {
        let fn = null
        switch (name) {
        case 'exportButton':
            fn = this.findExportElement
            break
        case 'cogWheel':
            fn = this.findSettingsElement
            break
        case 'signInButton':
            fn = this.findSignInButton
            break
        default:
            throw new Error('Page not supported')
        }
        return await withExponentialBackoff(fn)
    }

    init () {
        const animateElement = this.animateElement.bind(this)
        const findElement = this.findElement.bind(this)
        // FIXME: this is stolen from element-hiding.js, we would need a global util that would do this,
        // single page applications don't have a DOMContentLoaded event on navigations, so
        // we use proxy/reflect on history.pushState to find elements on page navigations
        const historyMethodProxy = new DDGProxy(this, History.prototype, 'pushState', {
            async apply (target, thisArg, args) {
                const pageURL = args[2].split('?')[0]
                const {name, style} = URL_ELEMENT_MAP[pageURL]
                const element = await findElement(name)
                animateElement(element, style)
                return DDGReflect.apply(target, thisArg, args)
            }
        })
        historyMethodProxy.overload()
        // listen for popstate events in order to run on back/forward navigations
        window.addEventListener('popstate', async () => {
            console.log('pushState URL', window.location.pathname)
            const {name, style} = URL_ELEMENT_MAP[window.location.pathname]
            const element = await findElement(name)
            animateElement(element, style)
        })

        document.addEventListener('DOMContentLoaded', async () => {
            console.log('pushState URL', window.location.pathname)
            const {name, style} = URL_ELEMENT_MAP[window.location.pathname]
            const element = await findElement(name)
            animateElement(element, style)
        })
    }
}
