// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Extractor } from '../types.js'

/**
 * @implements {Extractor<{profileUrl: string; identifier: string} | null>}
 */
export class ProfileUrlExtractor {
    /**
     * @param {string[]} strs
     * @param {import('../actions/extract.js').ExtractorParams} extractorParams
     */
    extract (strs, extractorParams) {
        if (strs.length === 0) return null
        const profile = {
            profileUrl: strs[0],
            identifier: strs[0]
        }

        if (!extractorParams.identifierType || !extractorParams.identifier) {
            return profile
        }

        const profileUrl = strs[0]
        profile.identifier = this.getIdFromProfileUrl(profileUrl, extractorParams.identifierType, extractorParams.identifier)
        return profile
    }

    /**
     * Parse a profile id from a profile URL
     * @param {string} profileUrl
     * @param {import('../actions/extract.js').IdentifierType} identifierType
     * @param {string} identifier
     * @return {string}
     */
    getIdFromProfileUrl (profileUrl, identifierType, identifier) {
        const parsedUrl = new URL(profileUrl)
        const urlParams = parsedUrl.searchParams

        // Attempt to parse out an id from the search parameters
        if (identifierType === 'param' && urlParams.has(identifier)) {
            const profileId = urlParams.get(identifier)
            return profileId || profileUrl
        }

        return profileUrl
    };
}
