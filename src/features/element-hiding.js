import { isBeingFramed, getFeatureSetting, matchHostname, DDGProxy, DDGReflect } from '../utils'

let adLabelStrings = []

function collapseDomNode(element, type) {
    console.log("attempting to hide element", element, type)
    if (!element) {
        return
    }
    
    switch (type) {
        case 'hide':
            if (!element.hidden) {
                element.style.setProperty('display', 'none', 'important')
                element.hidden = true
            }
            break
        case 'hide-empty':
            if (!element.hidden && isDomNodeEmpty(element)) {
                element.style.setProperty('display', 'none', 'important')
                element.hidden = true
            }
            break
        case 'closest-empty':
            // if element already hidden, continue onto parent element
            if (element.hidden) {
                collapseDomNode(element.parentNode, type)
            }
            
            if (isDomNodeEmpty(element)) {
                element.style.setProperty('display', 'none', 'important')
                element.hidden = true
                collapseDomNode(element.parentNode, type)
            }
            break
        default:
            console.log(`Unsupported rule: ${type}`)
    }
}

function isDomNodeEmpty (node) {
    const visibleText = node.innerText.trim().toLocaleLowerCase()
    const mediaContent = node.querySelector('iframe,video,canvas')
    if ((visibleText === '' || adLabelStrings.includes(visibleText)) && mediaContent === null) {
        return true
    }
    return false
}

function hideMatchingDomNodes(rules) {
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
    
    console.log("rules to be applied", activeRules)
    
    // now have the final list of rules to apply, so we apply them when document is loaded
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', (event) => {
            hideMatchingDomNodes(activeRules)
        })
    } else {
        hideMatchingDomNodes(activeRules)
    }
    // Single page applications don't have a DOMContentLoaded event on navigations, so
    // we use proxy/reflect on history.pushState and history.replaceState to call hideMatchingDomNodes
    // on page loads
    const methods = ['pushState', 'replaceState']
    for (const methodName of methods) {
        const historyMethodProxy = new DDGProxy(featureName, History.prototype, methodName, {
            apply(target, thisArg, args) {
                hideMatchingDomNodes(activeRules)
                return DDGReflect.apply(target, thisArg, args)
            }
        })
        historyMethodProxy.overload()
    }
}
