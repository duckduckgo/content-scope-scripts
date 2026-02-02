/**
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.ts').ConditionTypes} ConditionTypes
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
 * @param {ConditionTypes['text']} condition
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
 * @param {ConditionTypes['element']} config
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
 * Registry of condition evaluators.
 * Each key is a condition name (e.g., 'text', 'element').
 * The `*ALL` variant (e.g., 'textALL') is automatically derived.
 *
 * To add a new condition type, just add it here and define how to match with a
 * single condition. The ALL variant comes for free.
 *
 * @type {{[K in keyof ConditionTypes]: (condition: ConditionTypes[K]) => boolean}}
 */
const CONDITION_EVALUATORS = {
    text: evaluateSingleTextCondition,
    element: evaluateSingleElementCondition,
};

/**
 * Evaluate an array condition with configurable combinator.
 * @template T
 * @param {T | T[] | undefined} condition
 * @param {(value: T) => boolean} singleConditionEvaluator
 * @param {'OR' | 'AND'} combinator - How to combine array elements
 * @returns {boolean}
 */
function evaluateArrayCondition(condition, singleConditionEvaluator, combinator) {
    if (condition === undefined) return true;
    if (Array.isArray(condition)) {
        return combinator === 'OR'
            ? condition.some((v) => singleConditionEvaluator(v))
            : condition.every((v) => singleConditionEvaluator(v));
    }
    return singleConditionEvaluator(condition);
}

/**
 * Evaluate match conditions for a detector.
 *
 * For each registered condition type (e.g., 'text'), two keys are supported:
 * - `text` (OR): array means any must match
 * - `textALL` (AND): array means all must match
 *
 * Multiple condition keys are ANDed together (all must pass).
 *
 * This may be either a single condition or an array of conditions.
 *
 * Each key references a condition which must match. If an array is specified,
 * any condition in the array must match.
 *
 * @param {import('./parse.js').MatchConditionSingle} condition
 * @returns {boolean}
 */
function evaluateSingleMatchCondition(condition) {
    // Each registered condition type gets both `name` (OR) and `nameALL` (AND) variants
    for (const [name, evaluator] of Object.entries(CONDITION_EVALUATORS)) {
        // Check the OR variant (e.g., 'text')
        if (!evaluateArrayCondition(condition[name], evaluator, 'OR')) return false;
        // Check the ALL variant (e.g., 'textALL')
        if (!evaluateArrayCondition(condition[`${name}ALL`], evaluator, 'AND')) return false;
    }

    return true;
}

/**
 * Evaluate match conditions for a detector.
 *
 * Supported formats:
 * - Single condition object: `{ text: {...} }` - evaluated directly
 * - Array of alternatives: `[{...}, {...}]` - OR (any must match)
 *
 * Objects represent conjunction (AND), arrays represent disjunction (OR)
 * @param {import('./parse.js').MatchCondition} conditions
 * @returns {boolean}
 */
export function evaluateMatch(conditions) {
    return evaluateArrayCondition(conditions, evaluateSingleMatchCondition, 'OR');
}
