import { click } from './click.js'
import { ErrorResponse } from './types.js'

/**
 * @param {object} action
 * @param {string} action.id
 * @param {"extract" | "fillForm" | "click" | "expectation" | "getCaptchaInfo" | "solveCaptcha" | "navigate"} action.actionType
 * @param {any} data
 * @return {import('./types.js').ActionResponse}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function execute (action, data) {
    try {
        switch (action.actionType) {
        case 'click':
            return click(action)
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
