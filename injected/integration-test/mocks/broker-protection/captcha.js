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

export function createGetRecaptchaInfoAction() {
    return createGetCaptchaInfoAction({
        action: {
            captchaType: 'recaptcha2',
            selector: '.g-recaptcha',
        },
    });
}

export function createGetHCaptchaInfoAction() {
    return createGetCaptchaInfoAction({
        action: {
            captchaType: 'hcaptcha',
            selector: '.h-captcha',
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

export function createSolveRecaptchaAction() {
    return createSolveCaptchaAction({
        action: {
            captchaType: 'recaptcha2',
            selector: '.g-recaptcha',
        },
    });
}

export function createSolveHCaptchaAction() {
    return createSolveCaptchaAction({
        action: {
            captchaType: 'hcaptcha',
            selector: '.h-captcha',
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
