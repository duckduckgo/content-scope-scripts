import { createPirState, getBrokerProtectionTestPageUrl } from './utils';
/**
 * @import { GetCaptchaInfoAction, SolveCaptchaAction } from '../../../src/features/broker-protection/types.js'
 */

const MOCK_SITE_KEY = '6LeCl8UUAAAAAGssOpatU5nzFXH2D7UZEYelSLTn';

// Captcha actions

/**
 * @param {object} params
 * @param {Omit<GetCaptchaInfoAction, 'id' | 'actionType'>} params.action
 */
export function createGetCaptchaInfoAction({ action }) {
    return createPirState({
        action: {
            id: '8324',
            actionType: 'getCaptchaInfo',
            ...action,
        },
    });
}

/**
 * @param {Partial<GetCaptchaInfoAction>} [actionOverrides]
 */
export function createGetRecaptchaInfoAction(actionOverrides = {}) {
    return createGetCaptchaInfoAction({
        action: {
            captchaType: 'recaptcha2',
            selector: '.g-recaptcha',
            ...actionOverrides,
        },
    });
}

/**
 * @param {Partial<GetCaptchaInfoAction> & Pick<GetCaptchaInfoAction, 'selector'>} actionOverrides
 */
export function createGetImageCaptchaInfoAction(actionOverrides) {
    return createGetCaptchaInfoAction({
        action: {
            captchaType: 'image',
            ...actionOverrides,
        },
    });
}

/**
 * @param {Partial<GetCaptchaInfoAction> & Pick<GetCaptchaInfoAction, 'selector'>} actionOverrides
 */
export function createGetCloudFlareCaptchaInfoAction(actionOverrides) {
    return createGetCaptchaInfoAction({
        action: {
            captchaType: 'cloudFlareTurnstile',
            ...actionOverrides,
        },
    });
}

/**
 * @param {object} params
 * @param {Omit<SolveCaptchaAction, 'id' | 'actionType'>} params.action
 * @param {Record<string, any>} [params.data]
 */
export function createSolveCaptchaAction({ action, data }) {
    return createPirState({
        action: {
            id: '83241',
            actionType: 'solveCaptcha',
            ...action,
        },
        data: {
            token: 'test_token',
            ...data,
        },
    });
}

/**
 * @param {Partial<SolveCaptchaAction>} [actionOverrides]
 */
export function createSolveRecaptchaAction(actionOverrides = {}) {
    return createSolveCaptchaAction({
        action: {
            captchaType: 'recaptcha2',
            selector: '.g-recaptcha',
            ...actionOverrides,
        },
    });
}

/**
 * @param {Partial<SolveCaptchaAction> & Pick<SolveCaptchaAction, 'selector'>} actionOverrides
 */
export function createSolveImageCaptchaAction(actionOverrides) {
    return createSolveCaptchaAction({
        action: {
            captchaType: 'image',
            ...actionOverrides,
        },
    });
}

/**
 * @param {Partial<SolveCaptchaAction> & Pick<SolveCaptchaAction, 'selector'>} actionOverrides
 */
export function createSolveCloudFlareCaptchaAction(actionOverrides) {
    return createSolveCaptchaAction({
        action: {
            captchaType: 'cloudFlareTurnstile',
            ...actionOverrides,
        },
    });
}

// Captcha responses

/**
 *
 * @param {object} param
 * @param {string} param.captchaType
 * @param {string} param.targetPage
 * @returns {object}
 */
export function createCaptchaResponse({ captchaType, targetPage, ...overrides }) {
    return {
        siteKey: MOCK_SITE_KEY,
        url: getBrokerProtectionTestPageUrl(targetPage),
        type: captchaType,
        ...overrides,
    };
}

/**
 * @param {object} params
 * @param {string} params.targetPage
 */
export function createRecaptchaResponse(params) {
    return createCaptchaResponse({
        captchaType: 'recaptcha2',
        ...params,
    });
}
