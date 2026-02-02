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


/**
 * Check if an element is visible
 * @param {Element} element
 * @returns {boolean}
 */
function isVisible(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
        rect.width > 0.5 &&
        rect.height > 0.5 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        parseFloat(style.opacity) > 0.05
    );
}

/**
 * Evaluate text pattern match condition.
 *
 * `pattern` (disj): Array of regex patterns (or string representing a single pattern) - ANY pattern matching = success.
 *   Equivalent to `pattern: "foo|bar"` for `pattern: ["foo", "bar"]`.
 *
 * `selector` (disj): Array of CSS selectors (or string representing a single selector) - ANY selector matching = success.
 *   Equivalent to `selector: ".a, .b"` for `selector: [".a", ".b"]`.
 *   Defaults to `body` if not provided.
 *
 * The overall condition matches if ANY pattern matches text in ANY selected element.
 *
 * @param {import('./types.js').TextMatchCondition} condition
 * @returns {boolean}
 */
function evaluateSingleTextCondition(condition) {
    const patterns = asArray(condition.pattern);
    const selectors = asArray(condition.selector, ['body']);

    const patternComb = new RegExp(patterns.join('|'), 'i');

    // Disjunction: any selector having a matching element is success
    return selectors.some((selector) => {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            if (patternComb.test(element.textContent || '')) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Evaluate element presence condition.
 *
 * `selector` (disj): Array of CSS selectors (or string representing a single selector) - ANY selector matching = success.
 *   Equivalent to `selector: ".a, .b"` for `selector: [".a", ".b"]`.
 *
 * `visibility` [optional]: Whether the element must be 'visible', 'hidden', or 'any' (default).
 *
 * @param {import('./types.js').ElementMatchCondition} config
 * @returns {boolean}
 */
function evaluateSingleElementCondition(config) {
    const visibility = config.visibility ?? 'any';
    // Disjunction: any selector having a matching element is success
    return asArray(config.selector).some((selector) => {
        if (visibility === 'any') {
            // if we don't care about visibility, we can just do a quick existence check
            return document.querySelector(selector) !== null;
        }
        for (const element of document.querySelectorAll(selector)) {
            if (visibility === 'visible' && isVisible(element)) {
                return true;
            }
            if (visibility === 'hidden' && !isVisible(element)) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Evaluate an OR condition
 * @template T
 * @param {import('./types.js').OrArray<T> | undefined} condition
 * @param {(value: T) => boolean} singleConditionEvaluator
 * @returns {boolean}
 */
function evaluateORCondition(condition, singleConditionEvaluator) {
    if (condition === undefined) return true;
    if (Array.isArray(condition)) {
        return condition.some((v) => singleConditionEvaluator(v));
    }
    return singleConditionEvaluator(condition);
}

/**
 * Evaluate match conditions for a detector Objects (usually) represent
 * conjunction (AND), arrays (usually) represent disjunction (OR).
 *
 * @param {import('./types.js').MatchConditionSingle} condition
 * @returns {boolean}
 */
function evaluateSingleMatchCondition(condition) {
    // conjunction on keys
    if (!evaluateORCondition(condition.text, evaluateSingleTextCondition)) {
        return false;
    }
    if (!evaluateORCondition(condition.element, evaluateSingleElementCondition)) {
        return false;
    }
    return true;
}

/**
 * Evaluate match conditions for a detector.
 *
 * This determines whether the detector is considered to have successfully matched when run.
 *
 * Objects represent conjunction (AND), arrays represent disjunction (OR)
 * @param {import('./types.js').MatchCondition} conditions
 * @returns {boolean}
 */
export function evaluateMatch(conditions) {
    return evaluateORCondition(conditions, evaluateSingleMatchCondition);
}
