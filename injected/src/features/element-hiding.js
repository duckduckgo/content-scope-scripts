import ContentFeature from '../content-feature';
import { isBeingFramed, injectGlobalStyles } from '../utils';

/**
 * @typedef {Object} ElementHidingValue
 * @property {string} property
 * @property {string} value
 */

/**
 * @typedef {Object} ElementHidingRuleHide
 * @property {string} selector
 * @property {'hide-empty' | 'hide' | 'closest-empty' | 'override'} type
 */

/**
 * @typedef {Object} ElementHidingRuleModify
 * @property {string} selector
 * @property {'modify-style' | 'modify-attr'} type
 * @property {ElementHidingValue[]} values
 */

/**
 * @typedef {Object} ElementHidingRuleWithoutSelector
 * @property {'disable-default'} type
 */

/**
 * @typedef {ElementHidingRuleHide | ElementHidingRuleModify | ElementHidingRuleWithoutSelector} ElementHidingRule
 */

/**
 * @typedef {Object} ElementHidingDomain
 * @property {string | string[]} domain
 * @property {ElementHidingRule[]} rules
 */

/**
 * @typedef {Object} StyleTagException
 * @property {string} domain
 * @property {string} reason
 */

/**
 * @typedef {Object} ElementHidingConfiguration
 * @property {boolean} [useStrictHideStyleTag]
 * @property {ElementHidingRule[]} rules
 * @property {ElementHidingDomain[]} domains
 * @property {number[]} [hideTimeouts]
 * @property {number[]} [unhideTimeouts]
 * @property {string} [mediaAndFormSelectors]
 * @property {string[]} [adLabelStrings]
 * @property {StyleTagException[]} [styleTagExceptions]
 */

let adLabelStrings = [];
let parser;
let hiddenElements = new WeakMap();
let modifiedElements = new WeakMap();
let appliedRules = new Set();
let shouldInjectStyleTag = false;
let styleTagInjected = false;
/** @type {boolean} Cached per-pass; falls back to per-node checks when false. */
let useDOMParser = false;
let mediaAndFormSelectors = 'video,canvas,embed,object,audio,map,form,input,textarea,select,option,button';
let hideTimeouts = [0, 100, 300, 500, 1000, 2000, 3000];
let unhideTimeouts = [1250, 2250, 3000];

/** @type {ElementHiding} */
let featureInstance;

/**
 * Hide DOM element if rule conditions met
 * @param {HTMLElement} element
 * @param {ElementHidingRule} rule
 * @param {HTMLElement} [previousElement]
 */
function collapseDomNode(element, rule, previousElement) {
    if (!element) {
        return;
    }
    const type = rule.type;
    const alreadyHidden = hiddenElements.has(element);
    const alreadyModified = modifiedElements.has(element) && modifiedElements.get(element) === rule.type;
    // return if the element has already been hidden, or modified by the same rule type
    if (alreadyHidden || alreadyModified) {
        return;
    }

    switch (type) {
        case 'hide':
            hideNode(element);
            break;
        case 'hide-empty':
            if (isDomNodeEmpty(element)) {
                hideNode(element);
                appliedRules.add(rule);
            }
            break;
        case 'closest-empty':
            // hide the outermost empty node so that we may unhide if ad loads
            if (isDomNodeEmpty(element)) {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                collapseDomNode(element.parentNode, rule, element);
            } else if (previousElement) {
                hideNode(previousElement);
                appliedRules.add(rule);
            }
            break;
        case 'modify-attr':
            modifyAttribute(element, rule.values);
            break;
        case 'modify-style':
            modifyStyle(element, rule.values);
            break;
        default:
            break;
    }
}

/**
 * Unhide previously hidden DOM element if content loaded into it
 * @param {HTMLElement} element
 * @param {ElementHidingRule} rule
 */
function expandNonEmptyDomNode(element, rule) {
    if (!element) {
        return;
    }
    const type = rule.type;

    const alreadyHidden = hiddenElements.has(element);

    switch (type) {
        case 'hide':
            // only care about rule types that specifically apply to empty elements
            break;
        case 'hide-empty':
        case 'closest-empty':
            if (alreadyHidden && !isDomNodeEmpty(element)) {
                unhideNode(element);
            } else if (type === 'closest-empty') {
                // iterate upwards from matching DOM elements until we arrive at previously
                // hidden element. Unhide element if it contains visible content.
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                expandNonEmptyDomNode(element.parentNode, rule);
            }
            break;
        default:
            break;
    }
}

/**
 * Hide DOM element
 * @param {HTMLElement} element
 */
function hideNode(element) {
    // maintain a reference to each hidden element along with the properties
    // that are being overwritten
    const cachedDisplayProperties = {
        display: element.style.display,
        'min-height': element.style.minHeight,
        height: element.style.height,
    };
    hiddenElements.set(element, cachedDisplayProperties);

    // apply styles to hide element
    element.style.setProperty('display', 'none', 'important');
    element.style.setProperty('min-height', '0px', 'important');
    element.style.setProperty('height', '0px', 'important');
    element.hidden = true;
    // add debug flag to site breakage reports
    featureInstance.addDebugFlag();
}

/**
 * Show previously hidden DOM element
 * @param {HTMLElement} element
 */
function unhideNode(element) {
    const cachedDisplayProperties = hiddenElements.get(element);
    if (!cachedDisplayProperties) {
        return;
    }

    for (const prop in cachedDisplayProperties) {
        element.style.setProperty(prop, cachedDisplayProperties[prop]);
    }
    hiddenElements.delete(element);
    element.hidden = false;
}

/**
 * Check if element or any descendants contain custom elements (hyphenated tag names).
 * Custom elements may have constructors that execute observable code when cloned.
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function hasCustomElements(el) {
    if (el.tagName.includes('-')) return true;
    const all = el.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
        if (all[i].tagName.includes('-')) return true;
    }
    return false;
}

/**
 * Check if DOM element contains visible content
 * @param {HTMLElement} node
 */
function isDomNodeEmpty(node) {
    // no sense wasting cycles checking if the page's body element is empty
    if (node.tagName === 'BODY') {
        return false;
    }

    // Use cloneNode for performance, but fall back to DOMParser when custom elements
    // are present to avoid triggering custom element constructors (page-observable).
    // useDOMParser is cached per-pass via hasCustomElements check in hideAdNodes/unhideLoadedAds.
    // If the page-level cache is false, still check the node before cloning.
    const shouldUseDOMParser = useDOMParser || hasCustomElements(node);
    /** @type {HTMLElement} */
    let parsedNode;
    if (shouldUseDOMParser) {
        // DOMParser wraps content in <html><head>...</head><body>...</body></html>
        if (!parser) {
            parser = new DOMParser();
        }
        parsedNode = parser.parseFromString(node.outerHTML, 'text/html').documentElement;
    } else {
        parsedNode = /** @type {HTMLElement} */ (node.cloneNode(true));
    }

    if (!parsedNode) {
        return false;
    }
    parsedNode.querySelectorAll('base,link,meta,script,style,template,title,desc').forEach((el) => {
        el.remove();
    });

    const visibleText = parsedNode.innerText.trim().toLocaleLowerCase().replace(/:$/, '');
    // Check if root node itself matches (cloneNode doesn't wrap, so querySelector misses root)
    const rootMatchesMediaForm = parsedNode.matches?.(mediaAndFormSelectors) ?? false;
    const mediaAndFormContent = rootMatchesMediaForm || parsedNode.querySelector(mediaAndFormSelectors) !== null;
    const rootIsIframe = parsedNode.tagName === 'IFRAME';
    const frameElements = rootIsIframe ? [/** @type {HTMLIFrameElement} */ (parsedNode)] : [...parsedNode.querySelectorAll('iframe')];
    // query original node instead of parsedNode for img elements since heuristic relies
    // on size of image elements
    const imageElements = [...node.querySelectorAll('img,svg')];
    // about:blank iframes don't count as content, return true if:
    // - node doesn't contain any iframes
    // - node contains iframes, all of which are hidden or have src='about:blank'
    const noFramesWithContent = frameElements.every((frame) => {
        return frame.hidden || frame.src === 'about:blank';
    });
    // ad containers often contain tracking pixels and other small images (eg adchoices logo).
    // these should be treated as empty and hidden, but real images should not.
    const visibleImages = imageElements.some((image) => {
        return image.getBoundingClientRect().width > 20 || image.getBoundingClientRect().height > 20;
    });

    if ((visibleText === '' || adLabelStrings.includes(visibleText)) && !mediaAndFormContent && noFramesWithContent && !visibleImages) {
        return true;
    }
    return false;
}

/**
 * Modify specified attribute(s) on element
 * @param {HTMLElement} element
 * @param {ElementHidingValue[]} values
 */
function modifyAttribute(element, values) {
    values.forEach((item) => {
        element.setAttribute(item.property, item.value);
    });
    modifiedElements.set(element, 'modify-attr');
}

/**
 * Modify specified style(s) on element
 * @param {HTMLElement} element
 * @param {ElementHidingValue[]} values
 */
function modifyStyle(element, values) {
    values.forEach((item) => {
        element.style.setProperty(item.property, item.value, 'important');
    });
    modifiedElements.set(element, 'modify-style');
}

/**
 * Separate strict hide rules to inject as style tag if enabled
 * @param {ElementHidingRule[]} rules
 */
function extractTimeoutRules(rules) {
    if (!shouldInjectStyleTag) {
        return rules;
    }

    const strictHideRules = [];
    const timeoutRules = [];

    rules.forEach((rule) => {
        if (rule.type === 'hide') {
            strictHideRules.push(rule);
        } else {
            timeoutRules.push(rule);
        }
    });

    injectStyleTag(strictHideRules);
    return timeoutRules;
}

/**
 * Create styletag for strict hide rules and append it to the document
 * @param {ElementHidingRule[]} rules
 */
function injectStyleTag(rules) {
    // if style tag already injected on SPA url change, don't inject again
    if (styleTagInjected) {
        return;
    }
    // wrap selector list in :is(...) to make it a forgiving selector list. this enables
    // us to use selectors not supported in all browsers, eg :has in Firefox
    let selector = '';

    rules.forEach((rule, i) => {
        if (i !== rules.length - 1) {
            selector = selector.concat(/** @type {ElementHidingRuleHide | ElementHidingRuleModify} */ (rule).selector, ',');
        } else {
            selector = selector.concat(/** @type {ElementHidingRuleHide | ElementHidingRuleModify} */ (rule).selector);
        }
    });
    const styleTagProperties = 'display:none!important;min-height:0!important;height:0!important;';
    const styleTagContents = `${forgivingSelector(selector)} {${styleTagProperties}}`;

    injectGlobalStyles(styleTagContents);
    styleTagInjected = true;
}

/**
 * Apply list of active element hiding rules to page
 * @param {ElementHidingRule[]} rules
 */
function hideAdNodes(rules) {
    const document = globalThis.document;

    // Cache custom elements check once per pass to avoid repeated DOM traversal
    useDOMParser = hasCustomElements(document.body);

    rules.forEach((rule) => {
        const selector = forgivingSelector(/** @type {ElementHidingRuleHide | ElementHidingRuleModify} */ (rule).selector);
        const matchingElementArray = [...document.querySelectorAll(selector)];
        matchingElementArray.forEach((element) => {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            collapseDomNode(element, rule);
        });
    });
}

/**
 * Iterate over previously hidden elements, unhiding if content has loaded into them
 */
function unhideLoadedAds() {
    const document = globalThis.document;

    // Cache custom elements check once per pass to avoid repeated DOM traversal
    useDOMParser = hasCustomElements(document.body);

    appliedRules.forEach((rule) => {
        const selector = forgivingSelector(rule.selector);
        const matchingElementArray = [...document.querySelectorAll(selector)];
        matchingElementArray.forEach((element) => {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            expandNonEmptyDomNode(element, rule);
        });
    });
}

/**
 * Wrap selector(s) in :is(..) to make them forgiving
 */
function forgivingSelector(selector) {
    return `:is(${selector})`;
}

export default class ElementHiding extends ContentFeature {
    init() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        featureInstance = this;

        if (isBeingFramed()) {
            return;
        }

        let activeRules;
        /** @type {ElementHidingRule[]} */
        const globalRules = this.getFeatureSetting('rules');
        /** @type {string[]} */
        adLabelStrings = this.getFeatureSetting('adLabelStrings') || [];
        /** @type {boolean} */
        shouldInjectStyleTag = this.getFeatureSetting('useStrictHideStyleTag') || false;
        /** @type {number[]} */
        hideTimeouts = this.getFeatureSetting('hideTimeouts') || hideTimeouts;
        /** @type {number[]} */
        unhideTimeouts = this.getFeatureSetting('unhideTimeouts') || unhideTimeouts;
        /** @type {string} */
        mediaAndFormSelectors = this.getFeatureSetting('mediaAndFormSelectors');
        // Fall back to default value if setting is missing, null, empty, or other falsy values
        if (!mediaAndFormSelectors) {
            mediaAndFormSelectors = 'video,canvas,embed,object,audio,map,form,input,textarea,select,option,button';
        }

        if (shouldInjectStyleTag) {
            shouldInjectStyleTag = this.matchConditionalFeatureSetting('styleTagExceptions').length === 0;
        }

        // collect all matching rules for domain
        const activeDomainRules = this.matchConditionalFeatureSetting('domains').flatMap((item) => item.rules);

        const overrideRules = activeDomainRules.filter((rule) => {
            return rule.type === 'override';
        });

        const disableDefault = activeDomainRules.some((rule) => {
            return rule.type === 'disable-default';
        });

        // if rule with type 'disable-default' is present, ignore all global rules
        if (disableDefault) {
            activeRules = activeDomainRules.filter((rule) => {
                return rule.type !== 'disable-default';
            });
        } else {
            activeRules = activeDomainRules.concat(globalRules);
        }

        // remove overrides and rules that match overrides from array of rules to be applied to page
        overrideRules.forEach((override) => {
            activeRules = activeRules.filter((rule) => {
                return rule.selector !== override.selector;
            });
        });

        const applyRules = this.applyRules.bind(this);

        // now have the final list of rules to apply, so we apply them when document is loaded
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => {
                applyRules(activeRules);
            });
        } else {
            applyRules(activeRules);
        }
        this.activeRules = activeRules;
    }

    urlChanged() {
        if (this.activeRules) {
            this.applyRules(this.activeRules);
        }
    }

    /**
     * Apply relevant hiding rules to page at set intervals
     * @param {ElementHidingRule[]} rules
     */
    applyRules(rules) {
        const timeoutRules = extractTimeoutRules(rules);
        const clearCacheTimer = unhideTimeouts.concat(hideTimeouts).reduce((a, b) => Math.max(a, b), 0) + 100;

        // several passes are made to hide & unhide elements. this is necessary because we're not using
        // a mutation observer but we want to hide/unhide elements as soon as possible, and ads
        // frequently take from several hundred milliseconds to several seconds to load
        hideTimeouts.forEach((timeout) => {
            setTimeout(() => {
                hideAdNodes(timeoutRules);
            }, timeout);
        });

        // check previously hidden ad elements for contents, unhide if content has loaded after hiding.
        // we do this in order to display non-tracking ads that aren't blocked at the request level
        unhideTimeouts.forEach((timeout) => {
            setTimeout(() => {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                unhideLoadedAds(timeoutRules);
            }, timeout);
        });

        // clear appliedRules and hiddenElements caches once all checks have run
        setTimeout(() => {
            appliedRules = new Set();
            hiddenElements = new WeakMap();
            modifiedElements = new WeakMap();
        }, clearCacheTimer);
    }
}
