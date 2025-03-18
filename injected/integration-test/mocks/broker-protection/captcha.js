import { createPirState, getBrokerProtectionTestPageUrl } from './utils';
/**
 * @import { PirAction } from '../../../src/features/broker-protection/types.js'
 */

const MOCK_SITE_KEY = '6LeCl8UUAAAAAGssOpatU5nzFXH2D7UZEYelSLTn';

// Captcha actions

/**
 * @param {object} params
 * @param {Omit<PirAction, 'id' | 'actionType'>} params.action
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
 * @param {Partial<PirAction>} [actionOverrides]
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
 * @param {Partial<PirAction>} [actionOverrides]
 */
export function createGetHCaptchaInfoAction(actionOverrides = {}) {
    return createGetCaptchaInfoAction({
        action: {
            captchaType: 'hcaptcha',
            selector: '.h-captcha',
            ...actionOverrides,
        },
    });
}

/**
 * @param {object} params
 * @param {Omit<PirAction, 'id' | 'actionType'>} params.action
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
 * @param {Partial<PirAction>} [actionOverrides]
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
 * @param {Partial<PirAction>} [actionOverrides]
 */
export function createSolveHCaptchaAction(actionOverrides = {}) {
    return createSolveCaptchaAction({
        action: {
            captchaType: 'hcaptcha',
            selector: '.h-captcha',
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

/**
 * @param {object} params
 * @param {string} params.targetPage
 */
export function createHCaptchaResponse(params) {
    return createCaptchaResponse({ captchaType: 'hcaptcha', ...params });
}
