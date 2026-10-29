/**
 * Classifies selected text from the text and its element alone; nothing is sent anywhere to decide. Native matches the
 * result against its actions.
 *
 * @typedef {import('../../types/selection-tools.js').SelectionType} SelectionType
 * @typedef {object} SelectionContext
 * @property {SelectionType} shape
 * @property {string | null} language Primary language subtag, e.g. "es", or null when neither the text nor the page says
 */

const HAN = /\p{Script=Han}/gu;
/** @type {[RegExp, string][]} */
const SCRIPT_LANGUAGES = [
    [HAN, 'zh'],
    [/\p{Script=Hangul}/gu, 'ko'],
    [/\p{Script=Cyrillic}/gu, 'ru'],
    [/\p{Script=Arabic}/gu, 'ar'],
    [/\p{Script=Hebrew}/gu, 'he'],
    [/\p{Script=Greek}/gu, 'el'],
    [/\p{Script=Devanagari}/gu, 'hi'],
    [/\p{Script=Thai}/gu, 'th'],
];
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}]/gu;
// English is listed first so it wins ties.
/** @type {Record<string, string[]>} */
const STOPWORDS = {
    en: ['the', 'and', 'is', 'of', 'to', 'in', 'that', 'it', 'you', 'for', 'with', 'this', 'are', 'was', 'be'],
    es: ['el', 'la', 'los', 'las', 'de', 'que', 'y', 'en', 'es', 'por', 'una', 'con', 'para', 'del', 'sus'],
    fr: ['le', 'la', 'les', 'de', 'et', 'est', 'une', 'des', 'que', 'pour', 'dans', 'pas', 'qui', 'avec', 'nous'],
    de: ['der', 'die', 'das', 'und', 'ist', 'nicht', 'ein', 'eine', 'zu', 'mit', 'den', 'sich', 'auch', 'von', 'wir'],
    it: ['il', 'di', 'che', 'e', 'la', 'per', 'non', 'sono', 'una', 'con', 'gli', 'del', 'della', 'questo'],
    pt: ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'não', 'uma', 'com', 'os', 'você'],
};
/** @type {Record<string, RegExp>} */
const ACCENT_HINTS = { es: /[ñ¿¡]/i, fr: /[çœèêàù]/i, de: /[ßäöü]/i, pt: /[ãõ]/i };
const CODE_SIGNALS = /[{};]|=>|\(\)|===?|!==?|\b(function|const|let|var|def|return|import|public|private|async|await)\b/g;
// Letters and digits, with apostrophes or hyphens between them: "don't", "19th", "COVID-19".
const WORD = /^[\p{L}\p{M}\p{N}]+(?:['’\-‐][\p{L}\p{M}\p{N}]+)*$/u;
// Abbreviations such as "U.S." and "e.g.": parts this short keep a domain name from passing as a word.
const ABBREVIATION = /^\p{L}{1,2}(?:\.\p{L}{1,2})+$/u;
// What a drag picks up around a word: punctuation, quotes and brackets, such as "duck," or «palabra».
const EDGE_PUNCTUATION = /^\p{P}+|\p{P}+$/gu;
// Writing systems without spaces between words, where a run of letters can be a whole sentence.
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
const LONG_TEXT_CHARS = 500;

/**
 * "es-MX" → "es"; null for anything that isn't a language tag.
 * @param {string | null | undefined} tag
 * @returns {string | null}
 */
export function primaryLanguage(tag) {
    const primary = tag?.split(/[-_]/)[0]?.toLowerCase();
    return primary && /^[a-z]{2,3}$/.test(primary) ? primary : null;
}

/**
 * A writing system only decides the language when most letters use it, so one Japanese sentence inside a long English
 * selection doesn't make the whole selection Japanese. Japanese mixes kana with Han, so any kana tips Han to Japanese.
 * Null when the text alone can't tell: too few words, or none the word lists know.
 * @param {string} text
 * @returns {string | null} Primary language subtag
 */
export function detectLanguage(text) {
    /** @param {RegExp} pattern */
    const count = (pattern) => text.match(pattern)?.length ?? 0;
    const majority = count(/\p{L}/gu) / 2;
    const kana = count(KANA);
    if (kana && kana + count(HAN) > majority) {
        return 'ja';
    }
    for (const [pattern, language] of SCRIPT_LANGUAGES) {
        if (count(pattern) > majority) return language;
    }
    const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
    if (words.length < 3) return null;
    let best = null;
    let bestScore = 0;
    for (const [language, list] of Object.entries(STOPWORDS)) {
        const score = words.filter((word) => list.includes(word)).length + (ACCENT_HINTS[language]?.test(text) ? 2 : 0);
        if (score > bestScore) {
            best = language;
            bestScore = score;
        }
    }
    return bestScore >= 2 ? best : null;
}

/**
 * Indented lines catch languages like Python that have few of the punctuation signals. Signals must also be dense, so a
 * long mixed selection that merely contains a snippet reads as prose rather than code.
 * @param {string} text
 */
export function looksLikeCode(text) {
    const signals = (text.match(CODE_SIGNALS)?.length ?? 0) + (text.match(/^[ \t]{2,}\S/gm)?.length ?? 0);
    return signals >= 3 && signals * 25 >= text.length;
}

/**
 * One word in any language, without the punctuation around it, and with at least one letter, so a bare number isn't one.
 * @param {string} text
 */
function isWord(text) {
    const core = text.replace(EDGE_PUNCTUATION, '');
    if (!/\p{L}/u.test(core) || !(WORD.test(core) || ABBREVIATION.test(core))) return false;
    return core.length >= 2 && core.length <= (UNSPACED.test(core) ? 4 : 30);
}

/**
 * @param {string} rawText
 * @param {object} [hints]
 * @param {boolean} [hints.inCodeElement] Inside pre, code, kbd or samp
 * @param {string | null} [hints.markedLanguage] The page's lang attribute for the selection
 * @returns {SelectionContext}
 */
export function classify(rawText, { inCodeElement = false, markedLanguage = null } = {}) {
    const text = rawText.trim();
    const isCode = inCodeElement || looksLikeCode(text);
    // When the text alone can't tell, the page's own marking decides: a selection inside lang="nl" is Dutch even though
    // the word lists don't know Dutch. Without either, native takes it to be in the user's language.
    const language = detectLanguage(text) ?? primaryLanguage(markedLanguage);
    /** @type {SelectionType} */
    let shape = 'text';
    if (isCode) {
        shape = 'code';
    } else if (/\?\s*$/.test(text)) {
        // Before the word test, which would drop the question mark from "why?".
        shape = 'question';
    } else if (isWord(text)) {
        shape = 'word';
    } else if (text.length > LONG_TEXT_CHARS) {
        shape = 'long';
    }
    return { shape, language };
}
