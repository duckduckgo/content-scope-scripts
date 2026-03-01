/**
 * @param {string[]} [selectors]
 * @returns {boolean}
 */
export function checkSelectors(selectors) {
    if (!selectors || !Array.isArray(selectors)) {
        return false;
    }
    return selectors.some((selector) => document.querySelector(selector));
}

/**
 * @param {string[]} [selectors]
 * @returns {boolean}
 */
export function checkSelectorsWithVisibility(selectors) {
    if (!selectors || !Array.isArray(selectors)) {
        return false;
    }
    return selectors.some((selector) => {
        const element = document.querySelector(selector);
        return element && isVisible(element);
    });
}

/**
 * @param {string[]} [properties]
 * @returns {boolean}
 */
export function checkWindowProperties(properties) {
    if (!properties || !Array.isArray(properties)) {
        return false;
    }
    return properties.some((prop) => typeof window?.[prop] !== 'undefined');
}

/**
 * @param {Element} element
 * @returns {boolean}
 */
export function isVisible(element) {
    const computedStyle = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
        rect.width > 0.5 &&
        rect.height > 0.5 &&
        computedStyle.display !== 'none' &&
        computedStyle.visibility !== 'hidden' &&
        +computedStyle.opacity > 0.05
    );
}

/**
 * @param {Element} element
 * @param {string[]} [sources]
 * @returns {string}
 */
export function getTextContent(element, sources) {
    if (!sources || sources.length === 0) {
        return element.textContent || '';
    }
    return sources.map((source) => element[source] || '').join(' ');
}

/**
 * @param {string[]} [selectors]
 * @returns {boolean}
 */
export function matchesSelectors(selectors) {
    if (!selectors || !Array.isArray(selectors)) {
        return false;
    }
    const elements = queryAllSelectors(selectors);
    return elements.length > 0;
}

/**
 * @param {Element} element
 * @param {string[]} [patterns]
 * @param {string[]} [sources]
 * @returns {boolean}
 */
export function matchesTextPatterns(element, patterns, sources) {
    if (!patterns || !Array.isArray(patterns)) {
        return false;
    }
    const text = getTextContent(element, sources);
    return patterns.some((pattern) => {
        try {
            const regex = new RegExp(pattern, 'i');
            return regex.test(text);
        } catch {
            return false;
        }
    });
}

/**
 * @param {string[]} [patterns]
 * @param {string[]} [sources]
 * @returns {boolean}
 */
export function checkTextPatterns(patterns, sources) {
    if (!patterns || !Array.isArray(patterns)) {
        return false;
    }
    return matchesTextPatterns(document.body, patterns, sources);
}

/**
 * @param {string[]} selectors
 * @param {Element|Document} [root]
 * @returns {Element[]}
 */
export function queryAllSelectors(selectors, root = document) {
    if (!selectors || !Array.isArray(selectors) || selectors.length === 0) {
        return [];
    }
    const elements = root.querySelectorAll(selectors.join(','));
    return Array.from(elements);
}

/**
 * Convert string patterns to RegExp objects
 * Useful for config-driven detectors where patterns come from privacy-config as strings
 * @param {string[]} patterns - Array of regex pattern strings
 * @param {string} [flags='i'] - RegExp flags (default: case-insensitive)
 * @returns {RegExp[]}
 */
export function toRegExpArray(patterns, flags = 'i') {
    if (!patterns || !Array.isArray(patterns)) {
        return [];
    }
    return patterns
        .map((p) => {
            try {
                return new RegExp(p, flags);
            } catch {
                return null;
            }
        })
        .filter(/** @type {(r: RegExp | null) => r is RegExp} */ (r) => r !== null);
}
