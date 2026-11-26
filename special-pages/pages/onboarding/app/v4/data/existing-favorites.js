/**
 * Matching the user's existing favorites against the picker's suggested sites.
 * Hostnames are compared after dropping one leading `www.`, so `https://youtube.com/feed`
 * matches `https://www.youtube.com` while `mail.google.com` stays distinct from `google.com`.
 * A site whose URL has a path, such as `https://www.bbc.com/news`, also needs the favorite's path to sit under it,
 * so a bbc.com homepage favorite doesn't lock BBC News.
 * Mobile hosts such as `m.youtube.com` are a known miss.
 */

/**
 * @param {string} url
 * @returns {string | null} the lowercased hostname without a leading `www.`, or null if the URL doesn't parse
 */
export function hostKey(url) {
    return urlKey(url)?.host ?? null;
}

/**
 * @param {string} url
 * @returns {{ host: string, path: string } | null} the host key and the path without a trailing `/`, or null if the URL doesn't parse
 */
function urlKey(url) {
    try {
        const { hostname, pathname } = new URL(url);
        return { host: hostname.replace(/^www\./, ''), path: pathname.replace(/\/+$/, '') };
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
    // a favorite that doesn't parse has no key, so it must not match a site whose URL doesn't parse either
    const existing = existingFavorites.map(urlKey).filter((key) => key !== null);
    return sites
        .filter((site) => {
            const key = urlKey(site.url);
            if (key === null) return false;
            return existing.some(
                (favorite) => favorite.host === key.host && (favorite.path === key.path || favorite.path.startsWith(key.path + '/')),
            );
        })
        .map((site) => site.id);
}
