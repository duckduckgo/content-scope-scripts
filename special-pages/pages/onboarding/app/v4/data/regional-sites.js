/**
 * Picker sites whose URL depends on where the user is. Amazon is keyed on the OS region that native sends as
 * `init.region`, and Wikipedia on the page language. Every other site uses one URL and lets the site redirect.
 */

/**
 * Amazon store per OS region, as an ISO 3166-1 alpha-2 code. Any other region gets amazon.com, where Amazon
 * offers to switch store.
 *
 * @type {Record<string, string>}
 */
export const AMAZON_DOMAINS = {
    US: 'amazon.com',
    CA: 'amazon.ca',
    MX: 'amazon.com.mx',
    BR: 'amazon.com.br',
    GB: 'amazon.co.uk',
    IE: 'amazon.ie',
    DE: 'amazon.de',
    AT: 'amazon.de',
    CH: 'amazon.de',
    FR: 'amazon.fr',
    IT: 'amazon.it',
    ES: 'amazon.es',
    PT: 'amazon.es',
    NL: 'amazon.nl',
    BE: 'amazon.com.be',
    SE: 'amazon.se',
    PL: 'amazon.pl',
    TR: 'amazon.com.tr',
    IN: 'amazon.in',
    JP: 'amazon.co.jp',
    SG: 'amazon.sg',
    AU: 'amazon.com.au',
    NZ: 'amazon.com.au',
    AE: 'amazon.ae',
    SA: 'amazon.sa',
};

/**
 * @param {string | null | undefined} region - ISO 3166-1 alpha-2, any case
 * @returns {string}
 */
export function amazonUrl(region) {
    const key = typeof region === 'string' ? region.toUpperCase() : '';
    const domain = Object.prototype.hasOwnProperty.call(AMAZON_DOMAINS, key) ? AMAZON_DOMAINS[key] : 'amazon.com';
    return `https://www.${domain}`;
}

/**
 * @param {string | null | undefined} locale - two-letter language code, as `Environment.locale` holds it
 * @returns {string}
 */
export function wikipediaUrl(locale) {
    const language = typeof locale === 'string' && /^[a-z]{2}$/.test(locale) ? locale : 'en';
    return `https://${language}.wikipedia.org`;
}

/**
 * Points the Amazon and Wikipedia sites at the user's store and language. Other sites pass through unchanged.
 *
 * @param {import('../../../types/onboarding.ts').PickerSite[]} sites
 * @param {{ locale?: string | null, region?: string | null }} where
 * @returns {import('../../../types/onboarding.ts').PickerSite[]}
 */
export function regionalSites(sites, { locale, region }) {
    return sites.map((site) => {
        if (site.id === 'amazon') return { ...site, url: amazonUrl(region) };
        if (site.id === 'wikipedia') return { ...site, url: wikipediaUrl(locale) };
        return site;
    });
}
