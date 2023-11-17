import { ErrorResponse, SuccessResponse } from './actions.js'
import { transformUrl } from './buildUrl-transforms.js'

/**
 * This builds the proper URL given the URL template and userData.
 *
 * @param {import('../../types/dbp-messages.js').NavigateAction} action
 * @param userData
 * @return {Promise<SuccessResponse | ErrorResponse>}
 */
// eslint-disable-next-line require-await
export async function buildUrl (action, userData) {
    const result = replaceTemplatedUrl(action, userData)
    if ('error' in result) {
        return new ErrorResponse({ actionID: action.id, message: result.error })
    }

    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: { url: result.url } })
}

/**
 * Perform some basic validations before we continue into the templating.
 *
 * @param {Omit<import('../../types/dbp-messages.js').NavigateAction, 'actionType'>} action
 * @param userData
 * @return {{url: string} | {error: string}}
 */
export function replaceTemplatedUrl (action, userData) {
    const url = action?.url
    if (!url) {
        return { error: 'Error: No url provided.' }
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = new URL(action.url)
    } catch (e) {
        return { error: 'Error: Invalid URL provided.' }
    }

    if (!userData) {
        return { url }
    }

    return transformUrl(action, userData)
}
