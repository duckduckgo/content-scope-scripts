/**
 * Matching the user's existing favorites against the picker's suggested sites.
 * Hostnames are compared after dropping one leading `www.`, so `https://youtube.com/feed`
 * matches `https://www.youtube.com` while `mail.google.com` stays distinct from `google.com`.
 * Mobile hosts such as `m.youtube.com` are a known miss.
 */

/**
 * @param {string} url
 * @returns {string | null} the lowercased hostname without a leading `www.`, or null if the URL doesn't parse
 */
export function hostKey(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

/**
 * @param {import('../../../types/onboarding.ts').PickerSite[]} sites
 * @param {string[]} existingFavorites - favorite URLs; unparseable ones are skipped
 * @returns {string[]} the ids of the sites that are already favorites, in their original order
 */
export function existingSiteIds(sites, existingFavorites) {
    /** @type {Set<string | null>} */
    const existing = new Set(existingFavorites.map(hostKey));
    // a favorite that doesn't parse has no key, so it must not match a site whose URL doesn't parse either
    existing.delete(null);
    return sites.filter((site) => existing.has(hostKey(site.url))).map((site) => site.id);
}
