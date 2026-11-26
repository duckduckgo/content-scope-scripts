import ContentFeature from '../content-feature';
import { isBeingFramed, injectGlobalStyles } from '../utils';
import { getOwnPropertyDescriptor, NodePrototype, ReflectApply } from '../captured-globals.js';

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
 * @typedef {ElementHidingRuleHide | ElementHidingRuleModify} ElementHidingRuleWithSelector
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
 * @property {'domParser' | 'walk'} [emptyCheck]
 * @property {StyleTagException[]} [styleTagExceptions]
 */

let adLabelStrings = [];
const parser = new DOMParser();
let hiddenElements = new WeakMap();
let modifiedElements = new WeakMap();
let appliedRules = new Set();
let shouldInjectStyleTag = false;
let styleTagInjected = false;
let mediaAndFormSelectors = 'video,canvas,embed,object,audio,map,form,input,textarea,select,option,button';
/** @type {'domParser' | 'walk'} */
let emptyCheck = 'domParser';
/** @type {string[]} adLabelStrings after compactText, for the walk check */
let compactAdLabels = [];
// one more than the longest ad label: text longer than this cannot be an ad label
let adLabelTextLimit = 1;
let hideTimeouts = [0, 100, 300, 500, 1000, 2000, 3000];
let unhideTimeouts = [1250, 2250, 3000];

/** @type {ElementHiding} */
let featureInstance;

/**
 * @param {ElementHidingRule} rule
 * @returns {rule is ElementHidingRuleWithSelector}
 */
function hasSelector(rule) {
    return 'selector' in rule;
}

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

/** @type {unknown[]} */
const NO_ARGS = [];

/**
 * Returns a reader for a DOM property that calls the browser's own getter, captured when this script loads.
 * A page that later replaces the property, on a node or on its prototype, cannot change what the reader returns.
 * @param {object | undefined} prototype
 * @param {string} name
 * @returns {(target: any) => any}
 */
function captureGetter(prototype, name) {
    const getter = prototype && getOwnPropertyDescriptor(prototype, name)?.get;
    if (!getter) return (target) => target[name];
    return (target) => ReflectApply(getter, target, NO_ARGS);
}

// What the walk check reads from the page, captured at load so page overrides cannot steer or stall the walk.
const ElementPrototype = globalThis.Element?.prototype;
const readFirstChild = captureGetter(NodePrototype, 'firstChild');
const readNextSibling = captureGetter(NodePrototype, 'nextSibling');
const readParentNode = captureGetter(NodePrototype, 'parentNode');
const readNodeType = captureGetter(NodePrototype, 'nodeType');
const readLocalName = captureGetter(ElementPrototype, 'localName');
const readTextData = captureGetter(globalThis.CharacterData?.prototype, 'data');
const readHidden = captureGetter(globalThis.HTMLElement?.prototype, 'hidden');
const readFrameSrc = captureGetter(globalThis.HTMLIFrameElement?.prototype, 'src');
const nativeMatches = ElementPrototype?.matches;

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

// Tags the walk check ignores, with everything inside them. The DOMParser check removes the first eight from its copy.
// The walk also skips noscript: on a live page its contents are text the user never sees.
const walkSkippedTags = new Set(['base', 'link', 'meta', 'script', 'style', 'template', 'title', 'desc', 'noscript']);

// Tags that cannot have children in HTML. A script can still attach children to one, but they are never rendered
// and the DOMParser check never sees them, so the walk does not look inside.
const voidTags = new Set([
    'area',
    'base',
    'basefont',
    'bgsound',
    'br',
    'col',
    'embed',
    'frame',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);

// A walk that visits more nodes than this stops and leaves the element visible.
const MAX_WALK_NODES = 10000;

/**
 * Lower-case text with whitespace runs compacted to one space and a trailing colon removed
 * @param {string} text
 * @returns {string}
 */
function compactText(text) {
    return text.replace(/\s+/g, ' ').trim().toLocaleLowerCase().replace(/:$/, '');
}

/**
 * True for elements that count as content on their own: media and form elements,
 * and iframes that are not hidden or about:blank
 * @param {Element} el
 * @param {string} localName
 * @returns {boolean}
 */
function isContentElement(el, localName) {
    const matches = nativeMatches ? ReflectApply(nativeMatches, el, [mediaAndFormSelectors]) : el.matches(mediaAndFormSelectors);
    if (matches) return true;
    if (localName === 'iframe') {
        return !(readHidden(el) || readFrameSrc(el) === 'about:blank');
    }
    return false;
}

/**
 * Walk a live element in document order and report whether it has content, and the text it collected.
 * It only reads the tree; matching the text against the ad labels is the caller's job.
 * Content is a media or form element, a frame that is not blank or hidden, or more text than any ad label.
 * A walk that passes MAX_WALK_NODES also reports content, so the element stays visible.
 * Uses a loop instead of recursion, so tree depth cannot overflow the stack.
 * @param {Element} root
 * @param {number} maxText text longer than this, once compacted, is content
 * @returns {{content: boolean, text: string}}
 */
function walkForContent(root, maxText) {
    let text = '';
    let cap = maxText;
    let visited = 0;
    let climbs = 0;
    /** @type {Node | null} */
    let current = root;
    while (current) {
        if (++visited > MAX_WALK_NODES) return { content: true, text };
        let descend = false;
        // nodeType and localName instead of instanceof: they also work for nodes created in another frame
        const nodeType = readNodeType(current);
        if (nodeType === TEXT_NODE) {
            text += readTextData(current);
            if (text.length > cap) {
                if (compactText(text).length > maxText) return { content: true, text };
                cap = text.length * 2;
            }
        } else if (nodeType === ELEMENT_NODE) {
            const el = /** @type {Element} */ (current);
            const localName = readLocalName(el);
            if (localName === 'br') {
                // a line break separates words, whatever the engine's innerText does with it
                text += ' ';
            } else if (!walkSkippedTags.has(localName)) {
                if (isContentElement(el, localName)) return { content: true, text };
                // a blank or hidden iframe is not content itself, but text inside it still counts
                descend = !voidTags.has(localName) && readFirstChild(el) !== null;
            }
        }
        if (descend) {
            current = readFirstChild(current);
            continue;
        }
        if (current === root) break;
        // next node in document order: next sibling, or the next sibling of the nearest ancestor that has one
        while (current && readNextSibling(current) === null) {
            // a real tree never climbs more than it visited, so this is only a backstop
            if (++climbs > MAX_WALK_NODES) return { content: true, text };
            current = readParentNode(current);
            if (!current || current === root) current = null;
        }
        if (current) current = readNextSibling(current);
    }
    return { content: false, text };
}

/**
 * Check if DOM element contains visible content, by walking the live element.
 * Never calls DOMParser.
 * @param {HTMLElement} node
 * @returns {boolean}
 */
function isDomNodeEmptyWalk(node) {
    // no sense wasting cycles checking if the page's body element is empty
    if (node.tagName === 'BODY') {
        return false;
    }
    try {
        const found = walkForContent(node, adLabelTextLimit);
        if (found.content) return false;
        const visibleText = compactText(found.text);
        if (visibleText !== '' && !compactAdLabels.includes(visibleText)) return false;
        // query the live node for img elements since the heuristic relies on the rendered size of image elements.
        // ad containers often contain tracking pixels and other small images (eg adchoices logo).
        // these should be treated as empty and hidden, but real images should not.
        const visibleImages = [...node.querySelectorAll('img,svg')].some((image) => {
            return image.getBoundingClientRect().width > 20 || image.getBoundingClientRect().height > 20;
        });
        return !visibleImages;
    } catch {
        // Not expected, but the walk touches live page nodes, so do not let a throw escape into the hide pass.
        // Report "not empty" so the element stays visible: wrongly showing an empty ad slot is safer than hiding content.
        return false;
    }
}

/**
 * Check if DOM element contains visible content
 * @param {HTMLElement} node
 * @returns {boolean}
 */
function isDomNodeEmpty(node) {
    if (emptyCheck === 'walk') {
        return isDomNodeEmptyWalk(node);
    }
    return isDomNodeEmptyParser(node);
}

/**
 * Check if DOM element contains visible content, by parsing a copy of it
 * @param {HTMLElement} node
 */
function isDomNodeEmptyParser(node) {
    // no sense wasting cycles checking if the page's body element is empty
    if (node.tagName === 'BODY') {
        return false;
    }
    // use a DOMParser to remove all metadata elements before checking if
    // the node is empty.
    const parsedNode = parser.parseFromString(node.outerHTML, 'text/html').documentElement;
    parsedNode.querySelectorAll('base,link,meta,script,style,template,title,desc').forEach((el) => {
        el.remove();
    });

    const visibleText = parsedNode.innerText.trim().toLocaleLowerCase().replace(/:$/, '');
    const mediaAndFormContent = parsedNode.querySelector(mediaAndFormSelectors);
    const frameElements = [...parsedNode.querySelectorAll('iframe')];
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

    if (
        (visibleText === '' || adLabelStrings.includes(visibleText)) &&
        mediaAndFormContent === null &&
        noFramesWithContent &&
        !visibleImages
    ) {
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

    /** @type {ElementHidingRuleHide[]} */
    const strictHideRules = [];
    /** @type {ElementHidingRule[]} */
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
 * @param {ElementHidingRuleWithSelector[]} rules
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
            selector = selector.concat(rule.selector, ',');
        } else {
            selector = selector.concat(rule.selector);
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

    rules.filter(hasSelector).forEach((rule) => {
        let matchingElementArray;
        try {
            matchingElementArray = [...document.querySelectorAll(querySelectorFor(rule.selector))];
        } catch {
            // Invalid or unsupported selector. Skip this rule only - an
            // uncaught throw here would abort the whole pass.
            return;
        }
        matchingElementArray.forEach((element) => {
            collapseDomNode(element, rule);
        });
    });
}

/**
 * Iterate over previously hidden elements, unhiding if content has loaded into them
 */
function unhideLoadedAds() {
    const document = globalThis.document;

    appliedRules.forEach((rule) => {
        let matchingElementArray;
        try {
            matchingElementArray = [...document.querySelectorAll(querySelectorFor(rule.selector))];
        } catch {
            return;
        }
        matchingElementArray.forEach((element) => {
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

/**
 * Resolve a rule's selector for use with querySelectorAll
 *
 * :is() makes a selector list forgiving, but has a perf cost since
 * it's a pseudo-class that isn't indexed. Only wrap when the selector
 * might be a list, in which case one malformed selector can lead to
 * the rest of the list not applying
 */
function querySelectorFor(selector) {
    return selector.includes(',') ? forgivingSelector(selector) : selector;
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
        // anything other than 'walk' (missing or unknown) keeps the DOMParser check
        emptyCheck = this.getFeatureSetting('emptyCheck') === 'walk' ? 'walk' : 'domParser';
        // the labels get the same clean-up as the text they are compared with
        compactAdLabels = adLabelStrings.map((label) => compactText(label));
        adLabelTextLimit = compactAdLabels.reduce((max, label) => Math.max(max, label.length), 0) + 1;
        // Fall back to default value if setting is missing, null, empty, or other falsy values
        if (!mediaAndFormSelectors) {
            mediaAndFormSelectors = 'video,canvas,embed,object,audio,map,form,input,textarea,select,option,button';
        }

        if (shouldInjectStyleTag) {
            shouldInjectStyleTag = this.matchConditionalFeatureSetting('styleTagExceptions').length === 0;
        }

        // collect all matching rules for domain
        const activeDomainRules = this.matchConditionalFeatureSetting('domains').flatMap((item) => {
            return Array.isArray(item.rules) ? /** @type {ElementHidingRule[]} */ (item.rules) : [];
        });

        const overrideRules = activeDomainRules.filter(/** @returns {rule is ElementHidingRuleHide} */ (rule) => rule.type === 'override');

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
                return !hasSelector(rule) || rule.selector !== override.selector;
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
