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
 * @returns {string}
 */
const geDocumentLanuage = () => {
    // Check url params for override
    const urlParams = new URLSearchParams(window.location.search);
    const localeFromUrl = urlParams.get('locale');
    if (localeFromUrl) {
        return localeFromUrl;
    }

    // Check html element lang attribute
    const htmlElement = document.documentElement;
    if (htmlElement.lang) {
        return htmlElement.lang;
    }

    // Fallback to browser language or English
    return navigator.language || 'en';
};

/**
 * @returns {Intl.NumberFormat}
 */
export const getLocalizedNumberFormatter = () => {
    const locale = geDocumentLanuage();
    console.log('locale', locale);
    const localeToUse = translationsLocales[locale] || 'en-US';
    return new Intl.NumberFormat(localeToUse);
};
