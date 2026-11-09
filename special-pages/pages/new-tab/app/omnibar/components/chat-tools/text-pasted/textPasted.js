/**
 * @typedef {import('../../../../../types/new-tab.js').PastedTextLimits} PastedTextLimits
 */

/** Matches Duck.ai and the native apps when native sends no `pastedTextLimits`. */
export const DEFAULT_PASTED_TEXT_LIMITS = /** @type {PastedTextLimits} */ ({ pasteConversionThreshold: 4000, maxCharacters: 16000 });

/** Longest excerpt shown as a pasted-text chip title. */
export const TEXT_PASTED_EXCERPT_MAX_CHARS = 200;

/** Longest one-line summary of a paste (tooltip, remove label). */
export const TEXT_PASTED_SUMMARY_MAX_CHARS = 60;

/**
 * Native limits, falling back per field to the defaults when missing or invalid.
 * @param {Partial<PastedTextLimits> | null | undefined} limits
 * @returns {PastedTextLimits}
 */
export function resolvePastedTextLimits(limits) {
    const valid = (/** @type {unknown} */ n) => typeof n === 'number' && Number.isInteger(n) && n > 0;
    const maxCharacters = valid(limits?.maxCharacters)
        ? /** @type {number} */ (limits?.maxCharacters)
        : DEFAULT_PASTED_TEXT_LIMITS.maxCharacters;
    const threshold = valid(limits?.pasteConversionThreshold)
        ? /** @type {number} */ (limits?.pasteConversionThreshold)
        : DEFAULT_PASTED_TEXT_LIMITS.pasteConversionThreshold;
    return { pasteConversionThreshold: Math.min(threshold, maxCharacters), maxCharacters };
}

/**
 * Whether a text paste becomes a pasted-text attachment: long enough and not only whitespace.
 * Length is in UTF-16 code units, as Duck.ai and native measure it.
 * @param {string} text
 * @param {number} threshold
 */
export function isConvertibleTextPaste(text, threshold) {
    return text.length >= threshold && text.trim().length > 0;
}

/**
 * Characters that count against the prompt limit: the typed text plus every paste.
 * @param {string} query
 * @param {{ content: string }[]} pastes
 */
export function promptLength(query, pastes) {
    return pastes.reduce((count, paste) => count + paste.content.length, query.length);
}

/**
 * Start of the paste, for the chip title.
 * @param {string} content
 */
export function textPastedExcerpt(content) {
    return content.slice(0, TEXT_PASTED_EXCERPT_MAX_CHARS);
}

/**
 * From the first non-whitespace character to the next line break or the summary cap, with "…" when cut.
 * @param {string} content
 */
export function textPastedSummary(content) {
    const text = content.trimStart();
    const lineBreak = text.search(/\r?\n/);
    const end = Math.min(lineBreak === -1 ? text.length : lineBreak, TEXT_PASTED_SUMMARY_MAX_CHARS);
    return end < text.length ? `${text.slice(0, end).trimEnd()}…` : text;
}
