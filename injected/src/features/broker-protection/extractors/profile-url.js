// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AsyncProfileTransform } from '../types.js';
import { firstString, shapeString } from '../actions/extract.js';
import { cleanArray, hashObject } from '../utils/utils.js';

/**
 * Resolves a profileUrl from `source: 'pageUrl'`, an anchor's resolved `href`, or an
 * `attribute`/text, resolves it to an absolute URL (like the browser does for an `<a href>`),
 * then optionally parses an identifier out of it.
 *
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').ProfileUrlSpec} spec
 * @return {{profileUrl: string, identifier: string} | null}
 */
export function extractProfileUrl(select, root, spec) {
    const rawUrl =
        spec.source === 'pageUrl' ? firstString(cleanArray(globalThis.location.href)) : firstString(profileUrlStrings(select, root, spec));

    if (!rawUrl) return null;

    const url = parseProfileUrl(rawUrl);
    const profileUrl = url?.href ?? rawUrl;

    const profile = { profileUrl, identifier: profileUrl };
    if (spec.identifierType && spec.identifier) {
        profile.identifier = getIdFromProfileUrl(url, spec.identifierType, spec.identifier) ?? profileUrl;
    }
    return profile;
}

/**
 * Select and shape profileUrl candidates from the DOM, reading each element via
 * {@link readProfileUrlValue} rather than the generic text path.
 *
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').ProfileUrlSpec} spec
 * @return {string[]}
 */
function profileUrlStrings(select, root, spec) {
    return cleanArray(
        select(root, spec.selector, spec.findElements)
            .map((element) => readProfileUrlValue(element, spec))
            .map((value) => (value ? shapeString(value, spec) : value)),
    );
}

/**
 * Read a profileUrl candidate from an element. Unlike other fields (text only), profileUrl prefers
 * an explicit `attribute`, then an anchor's resolved `href` property, then falls back to text.
 *
 * @param {import('../actions/extract.js').ElementLike & {href?: string}} element
 * @param {import('../actions/extract.js').ProfileUrlSpec} spec
 * @return {string | null | undefined}
 */
function readProfileUrlValue(element, spec) {
    if (spec.attribute && 'getAttribute' in element) {
        return element.getAttribute?.(spec.attribute) ?? null;
    }
    if ('href' in element && element.href) {
        return element.href;
    }
    if ('innerText' in element) {
        return element.innerText ?? null;
    }
    if ('textContent' in element) {
        return element.textContent ?? null;
    }
    return undefined;
}

/**
 * Parse a (possibly relative) profile URL into an absolute `URL`, resolving against the current
 * page like the browser does for an `<a href>`.
 * @param {string} profileUrl
 * @return {URL | null} `null` when the value can't be parsed as a URL
 */
function parseProfileUrl(profileUrl) {
    try {
        return new URL(profileUrl, globalThis.location.href);
    } catch {
        return null;
    }
}

/**
 * Parse a profile id from an already-parsed profile URL.
 * @param {URL | null} url
 * @param {import('../actions/extract.js').IdentifierType} identifierType
 * @param {string} identifier
 * @return {string | null} the parsed id, or `null` to fall back to the profile URL
 */
function getIdFromProfileUrl(url, identifierType, identifier) {
    if (!url) return null;

    if (identifierType === 'param' && url.searchParams.has(identifier)) {
        return url.searchParams.get(identifier) || null;
    }

    return null;
}

/**
 * If a hash is needed, compute it from the profile and
 * set it as the 'identifier'
 *
 * @implements {AsyncProfileTransform}
 */
export class ProfileHashTransformer {
    /**
     * @param {Record<string, any>} profile - the extracted/aggregated profile data to transform
     * @param {import('../../../types/broker-protection.js').ProfileSpec} profileSpec - the action's `profile` block
     * @return {Promise<Record<string, any>>}
     */
    async transform(profile, profileSpec) {
        if (profileSpec?.profileUrl?.identifierType !== 'hash') {
            return profile;
        }

        return {
            ...profile,
            identifier: await hashObject(profile),
        };
    }
}
