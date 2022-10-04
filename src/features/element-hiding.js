import { isBeingFramed, getFeatureSetting, matchHostname, DDGProxy, DDGReflect } from '../utils'

let adLabelStrings = []

function collapseDomNode (element, type) {
    if (!element) {
        return
    }

    switch (type) {
    case 'hide':
        if (!element.hidden) {
            hideNode(element)
        }
        break
    case 'hide-empty':
        if (!element.hidden && isDomNodeEmpty(element)) {
            hideNode(element)
        }
        break
    case 'closest-empty':
        // if element already hidden, continue onto parent element
        if (element.hidden) {
            collapseDomNode(element.parentNode, type)
            break
        }

        if (isDomNodeEmpty(element)) {
            hideNode(element)
            collapseDomNode(element.parentNode, type)
        }
        break
    default:
        console.log(`Unsupported rule: ${type}`)
    }
}

function hideNode (element) {
    element.style.setProperty('display', 'none', 'important')
    element.hidden = true
}

function isDomNodeEmpty (node) {
    const visibleText = node.innerText.trim().toLocaleLowerCase()
    const mediaContent = node.querySelector('video,canvas')
    const frameElements = [...node.querySelectorAll('iframe')]
    // about:blank iframes don't count as content, return true if
    // node either doesn't contain any iframes or node contains only
    // iframes with src='about:blank'
    const noFramesWithContent = frameElements.every((frame) => {
        return frame.src === 'about:blank'
    })
    if ((visibleText === '' || adLabelStrings.includes(visibleText)) &&
        noFramesWithContent && mediaContent === null) {
        return true
    }
    return false
}

function hideMatchingDomNodes (rules) {
    const document = globalThis.document

    // wait 300ms before hiding ad containers so ads have a chance to load
    setTimeout(() => {
        rules.forEach((rule) => {
            const matchingElementArray = [...document.querySelectorAll(rule.selector)]
            matchingElementArray.forEach((element) => {
                collapseDomNode(element, rule.type)
            })
        })
    }, 300)

    // handle any ad containers that weren't added to the page within 300ms of page load
    setTimeout(() => {
        rules.forEach((rule) => {
            const matchingElementArray = [...document.querySelectorAll(rule.selector)]
            matchingElementArray.forEach((element) => {
                collapseDomNode(element, rule.type)
            })
        })
    }, 1000)
}

export function init (args) {
    if (isBeingFramed()) {
        return
    }

    const featureName = 'elementHiding'
    const domain = args.site.domain
    const domainRules = getFeatureSetting(featureName, args, 'domains')
    const globalRules = getFeatureSetting(featureName, args, 'rules')
    adLabelStrings = getFeatureSetting(featureName, args, 'adLabelStrings')

    // collect all matching rules for domain
    const activeDomainRules = domainRules.filter((rule) => {
        return matchHostname(domain, rule.domain)
    }).flatMap((item) => item.rules)

    const overrideRules = activeDomainRules.filter((rule) => {
        return rule.type === 'override'
    })

    let activeRules = activeDomainRules.concat(globalRules)

    // remove overrides and rules that match overrides from array of rules to be applied to page
    overrideRules.forEach((override) => {
        activeRules = activeRules.filter((rule) => {
            return rule.selector !== override.selector
        })
    })

    // now have the final list of rules to apply, so we apply them when document is loaded
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', (event) => {
            hideMatchingDomNodes(activeRules)
        })
    } else {
        hideMatchingDomNodes(activeRules)
    }
    // single page applications don't have a DOMContentLoaded event on navigations, so
    // we use proxy/reflect on history.pushState and history.replaceState to call hideMatchingDomNodes
    // on page navigations, and listen for popstate events that indicate a back/forward navigation
    const methods = ['pushState', 'replaceState']
    for (const methodName of methods) {
        const historyMethodProxy = new DDGProxy(featureName, History.prototype, methodName, {
            apply (target, thisArg, args) {
                hideMatchingDomNodes(activeRules)
                return DDGReflect.apply(target, thisArg, args)
            }
        })
        historyMethodProxy.overload()
    }
    window.addEventListener('popstate', (event) => {
        hideMatchingDomNodes(activeRules)
    })
}
