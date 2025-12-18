// All locales supported by c-s-s translations as of 2025-06
// Using regional variants in case we want to extend support for currency in the future
export const translationsLocales = {
    en: 'en-US',
    nl: 'nl-NL',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pl: 'pl-PL',
    pt: 'pt-PT',
    ru: 'ru-RU',
    es: 'es-ES',
};

/**
 * @param {keyof typeof translationsLocales} locale
 * @returns {Intl.NumberFormat}
 */
export const getLocalizedNumberFormatter = (locale) => {
    const localeToUse = translationsLocales[locale] || 'en-US'; // Fallback to English if locale is not supported

    return new Intl.NumberFormat(localeToUse);
};

/**
 * @type {(markdown: string) => string} convertMarkdownToHTMLForStrongTags
 */
export function convertMarkdownToHTMLForStrongTags(markdown) {
    // first, remove any HTML tags
    markdown = escapeXML(markdown);

    // Use a regular expression to find all the words wrapped in **
    const regex = /\*\*(.*?)\*\*/g;

    // Replace the matched text with the HTML <strong> tags
    const result = markdown.replace(regex, '<strong>$1</strong>');
    return result;
}

/**
 * Escapes any occurrences of &, ", <, > or / with XML entities.
 */
function escapeXML(str) {
    const replacements = {
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
        '<': '&lt;',
        '>': '&gt;',
        '/': '&#x2F;',
    };
    return String(str).replace(/[&"'<>/]/g, (m) => replacements[m]);
}
