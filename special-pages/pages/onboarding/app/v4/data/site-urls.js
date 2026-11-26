/**
 * Picks each picker site's URL for the user's region and language. The variants live in the site data, so this file
 * names no site. A site whose URLs follow no pattern lists them in `urlByRegion`, keyed on the OS region native sends
 * as `init.region`. A site whose URLs follow the page language gives a `urlTemplate` with a `{locale}` placeholder.
 * The region entry comes first, then the template, then `url`.
 */

/** @typedef {import('../../../types/onboarding.ts').TopSitesPickerSite} TopSitesPickerSite */

/**
 * @param {TopSitesPickerSite} site
 * @param {{ locale?: string | null, region?: string | null }} where - region as ISO 3166-1 alpha-2 in any case, locale
 *   as the two-letter language code `Environment.locale` holds
 * @returns {string}
 */
export function resolveSiteUrl(site, { locale, region }) {
    const regionKey = typeof region === 'string' ? region.toUpperCase() : '';
    const byRegion = site.urlByRegion;
    if (byRegion && regionKey && Object.prototype.hasOwnProperty.call(byRegion, regionKey)) {
        const url = byRegion[regionKey];
        if (url) return url;
    }

    // Only a two-letter code goes into the template, so a value like `../x` can't add a path or change the host.
    const language = typeof locale === 'string' ? locale.toLowerCase() : '';
    if (site.urlTemplate && /^[a-z]{2}$/.test(language)) {
        return site.urlTemplate.replace('{locale}', language);
    }

    return site.url;
}

/**
 * Returns the sites with each `url` resolved for the user. The input is not mutated.
 *
 * @param {TopSitesPickerSite[]} sites
 * @param {{ locale?: string | null, region?: string | null }} where
 * @returns {TopSitesPickerSite[]}
 */
export function resolveSiteUrls(sites, where) {
    return sites.map((site) => {
        const url = resolveSiteUrl(site, where);
        return url === site.url ? site : { ...site, url };
    });
}
