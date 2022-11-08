import { isBeingFramed, getFeatureSetting, matchHostname, DDGProxy, DDGReflect } from '../utils'

let adLabelStrings = []
const parser = new DOMParser()
const hiddenElements = new WeakSet()
const appliedRules = new Set()

/**
 * Hide DOM element if rule conditions met
 * @param {HTMLElement} element
 * @param {Object} rule
 * @param {HTMLElement} [previousElement]
 */
function collapseDomNode (element, rule, previousElement) {
    if (!element) {
        return
    }
    const type = rule.type
    const alreadyHidden = hiddenElements.has(element)

    if (alreadyHidden) {
        return
    }

    switch (type) {
    case 'hide':
        hideNode(element)
        break
    case 'hide-empty':
        if (isDomNodeEmpty(element)) {
            hideNode(element)
            appliedRules.add(rule)
        }
        break
    case 'closest-empty':
        // hide the outermost empty node so that we may unhide if ad loads
        if (isDomNodeEmpty(element)) {
            collapseDomNode(element.parentNode, rule, element)
        } else if (previousElement) {
            hideNode(previousElement)
            appliedRules.add(rule)
        }
        break
    default:
        break
    }
}

/**
 * Unhide previously hidden DOM element if content loaded into it
 * @param {HTMLElement} element
 * @param {Object} rule
 * @param {HTMLElement} [previousElement]
 */
function expandNonEmptyDomNode (element, rule, previousElement) {
    if (!element) {
        return
    }
    const type = rule.type

    const alreadyHidden = hiddenElements.has(element)

    switch (type) {
    case 'hide':
        // only care about rule types that specifically apply to empty elements
        break
    case 'hide-empty':
        if (alreadyHidden && !isDomNodeEmpty(element)) {
            unhideNode(element)
        }
        break
    case 'closest-empty':
        // iterate upwards from matching DOM elements until we arrive at previously
        // hidden element. Unhide element if it contains visible content.
        if (alreadyHidden) {
            if (!isDomNodeEmpty(element)) {
                unhideNode(element)
            }
            break
        } else {
            expandNonEmptyDomNode(element.parentNode, rule, element)
        }
        break
    default:
        break
    }
}

/**
 * Hide DOM element
 * @param {HTMLElement} element
 */
function hideNode (element) {
    // cache any previous inline display property
    if (element.style.display) {
        element.setAttribute('data-ddg-display', element.style.display)
    }
    element.style.setProperty('display', 'none', 'important')
    element.hidden = true

    // maintain a reference to each hidden element
    hiddenElements.add(element)
}

/**
 * Show previously hidden DOM element
 * @param {HTMLElement} element
 */
function unhideNode (element) {
    const prevDisplayProperty = element.getAttribute('data-ddg-display')
    element.hidden = false
    element.style.setProperty('display', prevDisplayProperty)
    element.removeAttribute('data-ddg-display')

    hiddenElements.delete(element)
}

/**
 * Check if DOM element contains visible content
 * @param {HTMLElement} node
 */
function isDomNodeEmpty (node) {
    // no sense wasting cycles checking if the page's body element is empty
    if (node.tagName === 'BODY') {
        return false
    }
    // use a DOMParser to remove all metadata elements before checking if
    // the node is empty.
    const parsedNode = parser.parseFromString(node.outerHTML, 'text/html').documentElement
    parsedNode.querySelectorAll('base,link,meta,script,style,template,title,desc').forEach((el) => {
        el.remove()
    })

    const visibleText = parsedNode.innerText.trim().toLocaleLowerCase().replace(/:$/, '')
    const mediaContent = parsedNode.querySelector('video,canvas,picture')
    const frameElements = [...parsedNode.querySelectorAll('iframe')]
    // about:blank iframes don't count as content, return true if:
    // - node doesn't contain any iframes
    // - node contains iframes, all of which are hidden or have src='about:blank'
    const noFramesWithContent = frameElements.every((frame) => {
        return (frame.hidden || frame.src === 'about:blank')
    })

    if ((visibleText === '' || adLabelStrings.includes(visibleText)) &&
        noFramesWithContent && mediaContent === null) {
        return true
    }
    return false
}

/**
 * Apply relevant hiding rules to page at set intervals
 * @param {Object[]} rules
 * @param {string} rules[].selector
 * @param {string} rules[].type
 */
function applyRules (rules) {
    // several passes are made to hide & unhide elements. this is necessary because we're not using
    // a mutation observer but we want to hide/unhide elements as soon as possible, and often
    // elements aren't present on the page immediately after page load.
    let hideIterations = 0
    let unhideIterations = 0
    hideAdNodes(rules)
    const hideInterval = setInterval(function () {
        hideIterations += 1
        if (hideIterations === 4) {
            clearInterval(hideInterval)
        }
        hideAdNodes(rules)
    }, 150)

    // check previously hidden ad elements for contents, unhide if content has loaded after hiding.
    // we do this in order to display non-tracking ads that aren't blocked at the request level
    const unhideInterval = setInterval(function () {
        unhideIterations += 1
        if (unhideIterations === 3) {
            clearInterval(unhideInterval)
        }
        unhideLoadedAds()
    }, 750)
}

/**
 * Apply list of active element hiding rules to page
 * @param {Object[]} rules
 * @param {string} rules[].selector
 * @param {string} rules[].type
 */
function hideAdNodes (rules) {
    const document = globalThis.document

    rules.forEach((rule) => {
        const matchingElementArray = [...document.querySelectorAll(rule.selector)]
        matchingElementArray.forEach((element) => {
            collapseDomNode(element, rule)
        })
    })
}

/**
 * Iterate over previously hidden elements, unhiding if content has loaded into them
 */
function unhideLoadedAds () {
    const document = globalThis.document

    appliedRules.forEach((rule) => {
        const matchingElementArray = [...document.querySelectorAll(rule.selector)]
        matchingElementArray.forEach((element) => {
            expandNonEmptyDomNode(element, rule)
        })
    })
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
            applyRules(activeRules)
        })
    } else {
        applyRules(activeRules)
    }
    // single page applications don't have a DOMContentLoaded event on navigations, so
    // we use proxy/reflect on history.pushState to call applyRules on page
    // navigations, and listen for popstate events that indicate a back/forward navigation
    const historyMethodProxy = new DDGProxy(featureName, History.prototype, 'pushState', {
        apply (target, thisArg, args) {
            applyRules(activeRules)
            return DDGReflect.apply(target, thisArg, args)
        }
    })
    historyMethodProxy.overload()

    window.addEventListener('popstate', (event) => {
        applyRules(activeRules)
    })
}
