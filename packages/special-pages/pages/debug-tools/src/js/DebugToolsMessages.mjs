import {
    getFeaturesResponseSchema, getTabsResponseSchema,
    remoteResourceSchema,
    updateResourceParamsSchema
} from '../../schema/__generated__/schema.parsers.mjs'
import { createContext } from 'react'

/**
 * @typedef {import("../../schema/__generated__/schema.types").RemoteResource} RemoteResource
 */

/**
 * Messaging
 */
export class DebugToolsMessages {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @internal
     */
    constructor (messaging) {
        /**
         * @internal
         */
        this.messaging = messaging
    }

    /**
     * @return {Promise<import("../../schema/__generated__/schema.types").GetFeaturesResponse>}
     */
    async getFeatures () {
        const response = await this.messaging.request('getFeatures')
        const parsed = getFeaturesResponseSchema.parse(response)
        const resources = parsed.features.remoteResources.resources;
        parsed.features.remoteResources.resources = resources.map(formatResource)
        return parsed;
    }
    attempts = 0
    /**
     * @param {import("../../schema/__generated__/schema.types").UpdateResourceParams} params
     * @return {Promise<import("../../schema/__generated__/schema.types").RemoteResource>}
     */
    async updateResource (params) {
        // this.attempts = this.attempts += 1;
        // if (this.attempts % 2 === 0) throw new Error('todo: error handling');
        const outgoing = updateResourceParamsSchema.parse(params)
        const response = await this.messaging.request('updateResource', outgoing)
        const featuresResponse = remoteResourceSchema.safeParse(response)
        if (featuresResponse.success) {
            const formatted = formatResource(featuresResponse.data);
            return formatted
        }
        console.log(featuresResponse.error)
        throw new Error('todo: error handling');
    }

    /**
     * @return {Promise<import("../../schema/__generated__/schema.types").GetTabsResponse>}
     */
    async getTabs () {
        const response = await this.messaging.request('getTabs', {})
        const featuresResponse = getTabsResponseSchema.safeParse(response)
        if (featuresResponse.success) {
            return featuresResponse.data
        }
        console.log(featuresResponse.error)
        throw new Error('todo: error handling');
    }
}

/**
 * @param {RemoteResource} input
 * @return {RemoteResource}
 */
function formatResource(input) {
    return {
        ...input,
        current: {
            ...input.current,
            contents: JSON.stringify(JSON.parse(input.current.contents), null, 4)
        }
    }
}

export const GlobalContext = createContext({
    /** @type {DebugToolsMessages | null} */
    messages: null,
    /** @type {import("history").History | null} */
    history: null,
})
