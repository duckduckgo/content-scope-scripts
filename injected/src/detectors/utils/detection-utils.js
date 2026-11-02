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
