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
            return extract(action, data)
        case 'click':
            return click(action, data)
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
