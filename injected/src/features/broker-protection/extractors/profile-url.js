// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AsyncProfileTransform, Extractor } from '../types.js';
import { hashObject } from '../utils/utils.js';

/**
 * @implements {Extractor<{profileUrl: string; identifier: string} | null>}
 */
export class ProfileUrlExtractor {
    /**
     * @param {string[]} strs
     * @param {import('../actions/extract.js').ExtractorParams} extractorParams
     */
    extract(strs, extractorParams) {
        if (strs.length === 0) return null;
        const firstStr = /** @type {string} */ (strs[0]);

        const url = this.parseProfileUrl(firstStr);
        const profileUrl = url?.href ?? firstStr;

        const profile = {
            profileUrl,
            identifier: profileUrl,
        };

        if (!extractorParams.identifierType || !extractorParams.identifier) {
            return profile;
        }

        profile.identifier = this.getIdFromProfileUrl(url, extractorParams.identifierType, extractorParams.identifier) ?? profileUrl;
        return profile;
    }

    /**
     * Parse a (possibly relative) profile URL into an absolute `URL`, resolving against
     * the current page like the browser does for an `<a href>`.
     * @param {string} profileUrl
     * @return {URL | null} `null` when the value can't be parsed as a URL
     */
    parseProfileUrl(profileUrl) {
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
    getIdFromProfileUrl(url, identifierType, identifier) {
        if (!url) return null;

        if (identifierType === 'param' && url.searchParams.has(identifier)) {
            return url.searchParams.get(identifier) || null;
        }

        return null;
    }
}

/**
 * If a hash is needed, compute it from the profile and
 * set it as the 'identifier'
 *
 * @implements {AsyncProfileTransform}
 */
export class ProfileHashTransformer {
    /**
     * @param {Record<string, any>} profile
     * @param {Record<string, any> } params
     * @return {Promise<Record<string, any>>}
     */
    async transform(profile, params) {
        if (params?.profileUrl?.identifierType !== 'hash') {
            return profile;
        }

        return {
            ...profile,
            identifier: await hashObject(profile),
        };
    }
}
