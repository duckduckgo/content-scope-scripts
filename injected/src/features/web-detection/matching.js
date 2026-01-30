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
 * The condition consists of the following keys:
 *
 * `pattern` (conj): An array of strings representing regular expressions to match against text context of the selected elements. All patterns must match.
 *
 * `selector` [optional] (conj): An array of strings representing element
 * selectors to match against. If not provided, the text will be taken from the
 * document body. If provided, the text pattern must match at least one element
 * selected by EACH of the selectors in the array.
 *
 * For example:
 *
 * {
 *   pattern: ['ads', 'analytics'],
 *   selector: ['#ads, #ads2', '#analytics'],
 * }
 *
 * This condition will match if any of the following is true:
 * - There is an element with ID '#ads' or '#ads2' on the page which contains both the strings 'ads' and 'analytics'
 * - AND there is an element with ID '#analytics' on the page which contains both the strings 'ads' and 'analytics'
 *
 * {
 *
 * @param {import('./types.js').TextMatchCondition} condition
 * @returns {boolean}
 */
function evaluateSingleTextCondition(condition) {
    const patterns = asArray(condition.pattern);
    const selectors = asArray(condition.selector, ['body']);

    /**
     * @param {string} content
     * @returns {boolean}
     */
    const testContent = (content) => {
        return patterns.every((pattern) => {
            const regex = new RegExp(pattern, 'i');
            return regex.test(content);
        });
    };

    /** @type {string[]} */
    return selectors.every((selector) => {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            if (testContent(element.textContent || '')) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Evaluate element presence condition.
 *
 * The condition consists of the following keys:
 * - selector: (conj) An array of strings representing the selectors to get
 * - visibility [optional]: Whether the element must be visible, hidden, or either
 *
 * @param {import('./types.js').ElementMatchCondition} config
 * @returns {boolean}
 */
function evaluateSingleElementCondition(config) {
    const visibility = config.visibility ?? 'any';
    return asArray(config.selector).every((selector) => {
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
