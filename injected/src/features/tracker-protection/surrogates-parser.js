/**
 * Parse the surrogates.txt wire format into a callable function map.
 *
 * Format: blocks separated by blank lines (\n\n). Each block:
 * - First line: `<domain>/<filename> <mime-type>`
 * - Remaining lines: raw JavaScript source
 * - Lines starting with `#` are comments and are stripped.
 *
 * The key used for lookup is the filename portion only (e.g. `analytics.js`),
 * matching the `surrogate` field in TDS tracker rules.
 *
 * @param {string | null | undefined} text - Raw surrogates.txt content from native
 * @returns {Record<string, () => void>} Map of surrogate name → callable function
 */
export function parseSurrogates(text) {
    /** @type {Record<string, () => void>} */
    const surrogates = {};

    if (!text || typeof text !== 'string') {
        return surrogates;
    }

    const blocks = text.trim().split('\n\n');

    for (const block of blocks) {
        const lines = block.split('\n').filter((line) => !line.startsWith('#'));
        const headerLine = lines.shift();

        if (!headerLine) continue;

        const tokens = headerLine.split(' ');
        const firstToken = tokens[0] ?? '';
        const slashIdx = firstToken.indexOf('/');
        const pattern = slashIdx >= 0 ? firstToken.substring(slashIdx + 1) : firstToken;

        if (!pattern) continue;

        const code = lines.join('\n');
        if (!code.trim()) continue;

        try {
            // eslint-disable-next-line no-new-func
            surrogates[pattern] = /** @type {() => void} */ (new Function(code));
        } catch {
            // Skip surrogates with syntax errors — tracker blocking still works without them
        }
    }

    return surrogates;
}
