import { buildUrl } from './actions/build-url.js'
import { extract } from './actions/extract.js'
import { fillForm } from './actions/fill-form.js'
import { getCaptchaInfo, solveCaptcha } from './actions/captcha.js'
import { click } from './actions/click.js'
import { expectation } from './actions/expectation.js'
import { ErrorResponse } from './types.js'

/**
 * @param {object} action
 * @param {string} action.id
 * @param {string} [action.dataSource] - optional data source
 * @param {"extract" | "fillForm" | "click" | "expectation" | "getCaptchaInfo" | "solveCaptcha" | "navigate"} action.actionType
 * @param {Record<string, any>} inputData
 * @param {Document} [root] - optional root element
 * @return {Promise<import('./types.js').ActionResponse>}
 */
export async function execute (action, inputData, root = document) {
    try {
        switch (action.actionType) {
        case 'navigate':
            return buildUrl(action, data(action, inputData, 'userProfile'))
        case 'extract':
            return await extract(action, data(action, inputData, 'userProfile'), root)
        case 'click':
            return click(action, data(action, inputData, 'userProfile'), root)
        case 'expectation':
            return expectation(action, data(action, inputData, 'userProfile'), root)
        case 'fillForm':
            return fillForm(action, data(action, inputData, 'extractedProfile'), root)
        case 'getCaptchaInfo':
            return getCaptchaInfo(action, root)
        case 'solveCaptcha':
            return solveCaptcha(action, data(action, inputData, 'token'), root)
        default: {
            return new ErrorResponse({
                actionID: action.id,
                message: `unimplemented actionType: ${action.actionType}`
            })
        }
        }
    } catch (e) {
        console.log('unhandled exception: ', e)
        return new ErrorResponse({
            actionID: action.id,
            message: `unhandled exception: ${e.message}`
        })
    }
}

/**
 * @param {{dataSource?: string}} action
 * @param {Record<string, any>} data
 * @param {string} defaultSource
 */
function data (action, data, defaultSource) {
    if (!data) return null
    const source = action.dataSource || defaultSource
    if (Object.prototype.hasOwnProperty.call(data, source)) {
        return data[source]
    }
    return null
}
