// All locales supported by c-s-s translations as of 2025-06
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
 * @param {string} locale
 * @returns {Intl.NumberFormat}
 */
export const getLocalizedNumberFormatter = (locale) => {
    const localeToUse = translationsLocales[locale] || 'en-US';
    return new Intl.NumberFormat(localeToUse);
};
