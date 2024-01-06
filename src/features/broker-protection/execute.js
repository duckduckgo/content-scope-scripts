import { buildUrl } from './actions/build-url.js'
import { extractProfiles } from './actions/extract.js'
import { fillForm } from './actions/fill-form.js'
import { getCaptchaInfo, solveCaptcha } from './actions/captcha.js'
import { click } from './actions/click.js'
import { expectation } from './actions/expectation.js'
import { ErrorResponse } from './types.js'

/**
 * @param {import('../../types/broker-protection.js').IncomingAction} action
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
            const unhandledAction = /** @type {any} */(action)
            return new ErrorResponse({
                actionID: unhandledAction.id,
                message: `unimplemented actionType: ${unhandledAction.actionType}`
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
