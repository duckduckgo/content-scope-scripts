/**
 * Scaffolding for writing an algorithm experiment.
 *
 * Every xpath experiment so far has differed from the shipped implementation in
 * exactly one place: how a compiled XPath expression becomes a boolean "did any
 * pattern match the selected text". This module holds the surrounding condition
 * tree and takes that one step as a parameter, so an experiment is the handful of
 * lines it actually changes rather than a copy of `matching.js`.
 *
 * ```js
 * import { createMatcher, snapshot } from '../lib/matcher.mjs';
 *
 * export const { evaluateMatch } = createMatcher({
 *     matchXPath(pattern, expression) {
 *         // the thing being tried
 *     },
 * });
 * ```
 *
 * SCOPE: the `text` condition path only. Element conditions get a presence-only
 * check, which is all the specs in this directory need and keeps `isVisible` and
 * `hasContent` - which force layout and serialise subtrees - out of a file whose
 * only job is to be a faithful stand-in for text matching.
 *
 * FAITHFULNESS: this is a copy of a tree that `matching.js` keeps module-private,
 * so it can drift, and drift would silently invalidate any comparison built on it.
 * `drift-guard.mjs` exists to catch that; run it after changing either file.
 */

/**
 * @template T
 * @param {T | T[] | undefined} value
 * @param {T[]} [defaultValue]
 * @returns {T[]}
 */
function asArray(value, defaultValue = []) {
    if (value === undefined) return defaultValue;
    return Array.isArray(value) ? value : [value];
}

/** `XPathResult.ORDERED_NODE_SNAPSHOT_TYPE`, inlined as in `matching.js`. */
export const ORDERED_NODE_SNAPSHOT_TYPE = 7;

/** @type {WeakMap<Document, Map<string, XPathExpression>>} */
const compiledXPaths = new WeakMap();

/**
 * Compile an XPath expression once per document, as the shipped implementation
 * does. An experiment that skipped this would be measuring expression parsing.
 *
 * @param {string} expression
 * @returns {XPathExpression}
 */
export function compileXPath(expression) {
    let cache = compiledXPaths.get(document);
    if (!cache) {
        cache = new Map();
        compiledXPaths.set(document, cache);
    }
    let compiled = cache.get(expression);
    if (!compiled) {
        compiled = document.createExpression(expression, null);
        cache.set(expression, compiled);
    }
    return compiled;
}

/**
 * @param {string} expression
 * @returns {XPathResult}
 */
export function snapshot(expression) {
    return compileXPath(expression).evaluate(document, ORDERED_NODE_SNAPSHOT_TYPE, null);
}

/**
 * The one step that varies between experiments.
 *
 * `xpathConfig` is passed through unresolved so an experiment can honour a
 * configured `chunkSize`/`chunkTail` rather than hardcoding its own constants,
 * which is what lets a config spec drive a code variant.
 *
 * @callback MatchXPath
 * @param {RegExp} pattern - The combined pattern for the condition
 * @param {string} expression - A single XPath expression from the condition
 * @param {{ chunkSize?: number, chunkTail?: number } | undefined} xpathConfig
 * @returns {boolean}
 */

/**
 * @param {{ matchXPath: MatchXPath }} strategy
 * @returns {{ evaluateMatch: (conditions: any) => boolean }}
 */
export function createMatcher({ matchXPath }) {
    /** @param {any} condition */
    function evaluateSingleTextCondition(condition) {
        const patterns = asArray(condition.pattern);
        const xpaths = asArray(condition.xpath);
        // `body` is only the implicit source when the condition names no source of its own
        const selectors = asArray(condition.selector, xpaths.length > 0 ? [] : ['body']);

        const patternComb = new RegExp(patterns.join('|'), 'i');

        // Checked before xpath, as in the shipped implementation: CSS matching avoids
        // the snapshot allocation `document.evaluate` requires. Gating depends on this
        // order, so an experiment that reversed it would not be comparable.
        const selectorMatch = selectors.some((selector) => {
            for (const element of document.querySelectorAll(selector)) {
                if (patternComb.test(element.textContent || '')) return true;
            }
            return false;
        });
        if (selectorMatch) return true;

        return xpaths.some((expression) => matchXPath(patternComb, expression, condition.xpathConfig));
    }

    /** @param {any} config */
    function evaluateSingleElementCondition(config) {
        return asArray(config.selector).some((selector) => document.querySelector(selector) !== null);
    }

    /**
     * @param {any} node
     * @param {(final: any) => boolean} evalFinal
     * @returns {boolean}
     */
    function evaluateNode(node, evalFinal) {
        if (node === undefined) return true;
        if (Array.isArray(node)) return node.some((n) => evaluateNode(n, evalFinal));
        if (node === null || typeof node !== 'object') return evalFinal(node);

        const operatorKeys = ['any', 'all', 'none'];
        const opKeys = operatorKeys.filter((k) => Object.prototype.hasOwnProperty.call(node, k));
        if (opKeys.length === 0) return evalFinal(node);

        const otherKeys = Object.keys(node).filter((k) => !operatorKeys.includes(k));
        if (otherKeys.length > 0) {
            throw new Error(`Condition node mixes operator keys [${opKeys.join(', ')}] with leaf fields [${otherKeys.join(', ')}]`);
        }

        if (Object.prototype.hasOwnProperty.call(node, 'all') && !asArray(node.all).every((n) => evaluateNode(n, evalFinal))) {
            return false;
        }
        if (Object.prototype.hasOwnProperty.call(node, 'any') && !asArray(node.any).some((n) => evaluateNode(n, evalFinal))) {
            return false;
        }
        if (Object.prototype.hasOwnProperty.call(node, 'none') && asArray(node.none).some((n) => evaluateNode(n, evalFinal))) {
            return false;
        }
        return true;
    }

    /** @param {any} condition */
    function evaluateSingleMatchCondition(condition) {
        if (!evaluateNode(condition.text, evaluateSingleTextCondition)) return false;
        if (!evaluateNode(condition.element, evaluateSingleElementCondition)) return false;
        return true;
    }

    return {
        evaluateMatch: (conditions) => evaluateNode(conditions, evaluateSingleMatchCondition),
    };
}
