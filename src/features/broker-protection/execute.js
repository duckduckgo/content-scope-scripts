import { buildUrl } from './buildUrl.js'
import { extractProfiles } from './extract.js'
import { fillForm } from './fillForm.js'
import { getCaptchaInfo, solveCaptcha } from './captcha.js'
import { click } from './click.js'
import { expectation } from './expectation.js'
import { ErrorResponse } from './types.js'

/**
 * @param {object} action
 * @param {string} action.id
 * @param {"extract" | "fillForm" | "click" | "expectation" | "getCaptchaInfo" | "solveCaptcha" | "navigate"} action.actionType
 * @param {any} data
 * @return {import('./types.js').ActionResponse}
 */
export function execute (action, data) {
    try {
        switch (action.actionType) {
        case 'navigate':
            return buildUrl(action, data)
        case 'extract':
            return extractProfiles(action, data)
        case 'click':
            return click(action)
        case 'expectation':
            return expectation(action)
        case 'fillForm':
            return fillForm(action, data)
        case 'getCaptchaInfo':
            return getCaptchaInfo(action)
        case 'solveCaptcha':
            return solveCaptcha(action, data.token)
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
