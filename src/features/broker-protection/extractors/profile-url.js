// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Extractor } from '../types.js'
import { getIdFromProfileUrl } from '../actions/extract.js'

/**
 * @implements {Extractor<{profileUrl: string; identifier: string} | null>}
 */
export class ProfileUrlExtractor {
    /**
     * @param {string[]} strs
     * @param {import('../actions/extract.js').ExtractorParams} extractorParams
     */
    async extract (strs, extractorParams) {
        if (strs.length === 0) return null
        const profile = {
            profileUrl: strs[0],
            identifier: strs[0]
        }

        if (!extractorParams.identifierType || !extractorParams.identifier) {
            return profile
        }

        const profileUrl = strs[0]
        profile.identifier = getIdFromProfileUrl(profileUrl, extractorParams.identifierType, extractorParams.identifier)
        return profile
    }
}
