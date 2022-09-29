import { isBeingFramed, getFeatureSetting, getFeatureSettingEnabled, matchHostname } from '../utils'

function collapseDomNode(element, type) {
    console.log("attempting to hide element", element, type)
    if (!element) {
        return
    }
    
    if (type === 'hide') {
        if (isDomNodeEmpty(element)) {
            element.style.setProperty('display', 'none', 'important')
            element.hidden = true
        }
    }
    
    if (type === 'closest-empty') {
        if (isDomNodeEmpty(element)) {
            element.style.setProperty('display', 'none', 'important')
            element.hidden = true
            
//            if (element.parentNode.childElementCount === 1) {
                collapseDomNode(element.parentNode, type)
            }
//        }
    }
}

function isDomNodeEmpty (node) {
    if (node.childElementCount === 0 ||
        node.textContent.trim() === '' || node.textContent.trim().toLocaleLowerCase() === 'advertisement' ||
        [...node.children].every((el) => (el.nodeName === 'SCRIPT' || el.hidden === true || el.textContent.trim() === ''))) {
        return true
    }
    return false
}

function hideMatchingDomNodes(rules) {
    const document = globalThis.document
    
    rules.forEach((rule) => {
        const matchingElementArray = [...document.querySelectorAll(rule.selector)]
        matchingElementArray.forEach((element) => {
            collapseDomNode(element, rule.type)
        })
        
    })
}

export function init (args) {
    if (isBeingFramed()) {
        return
    }
    console.log("elementHiding successfully injected")
    
    const document = globalThis.document
    const featureName = 'elementHiding'
    const domain = args.site.domain
    const domainRules = getFeatureSetting(featureName, args, 'domains')
    const globalRules = getFeatureSetting(featureName, args, 'rules')

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
            setTimeout(() => {
                hideMatchingDomNodes(activeRules)
            }, 300)
        })
    } else {
        setTimeout(() => {
            hideMatchingDomNodes(activeRules)
        }, 300)
    }
    // SPAs like aljazeera.com don't have a DOMContentLoaded event on navigations, so we set
    // up a listener on popstate as well
    window.addEventListener('popstate', (event) => {
        setTimeout(() => {
            hideMatchingDomNodes(activeRules)
        }, 300)
    })
    
    //console.log("getFeatureSettingEnabled", getFeatureSettingEnabled())
    console.log(args)
}
