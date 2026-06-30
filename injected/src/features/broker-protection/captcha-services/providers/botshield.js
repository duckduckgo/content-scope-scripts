import { PirError, PirSuccess } from '../../types';
import { stringifyFunction } from '../utils/stringify-function';
import { injectTokenIntoElement } from '../utils/token';
import { isElementType } from '../utils/element';

/**
 * InfoTracer BotShield provider. The slider token is not server verified, so we
 * write the backend-generated token into the hidden field instead of dragging it.
 */
const botShieldConfig = {
    type: 'botShield',
    identifier: 'infotracer-botshield',
    tokenSelectors: ['#botTokenInput', 'input[name="InfoPay_Core_Components_OptOuts_DataRemovalServiceModel[validSubmitCode]"]'],
};

/**
 * @param {HTMLElement} element
 * @returns {Document}
 */
const getDocument = (element) => element.ownerDocument ?? document;

/**
 * @param {Document} root
 * @returns {HTMLElement[]}
 */
const getTokenInputs = (root) => {
    return botShieldConfig.tokenSelectors.reduce((/** @type {HTMLElement[]} */ accumulator, selector) => {
        const element = root.querySelector(selector);
        if (element instanceof HTMLElement && isElementType(element, 'input')) {
            accumulator.push(element);
        }
        return accumulator;
    }, []);
};

/**
 * @import { CaptchaProvider } from './provider.interface';
 * @import { PirResponse } from '../../types';
 * @implements {CaptchaProvider}
 */
export class BotShieldProvider {
    /**
     * @returns {string}
     */
    getType() {
        return botShieldConfig.type;
    }

    /**
     * @param {Document | HTMLElement} _root
     * @param {HTMLElement} captchaContainerElement
     * @returns {boolean}
     */
    isSupportedForElement(_root, captchaContainerElement) {
        return getTokenInputs(getDocument(captchaContainerElement)).length > 0;
    }

    /**
     * @param {HTMLElement} _captchaContainerElement
     * @returns {Promise<string>}
     */
    getCaptchaIdentifier(_captchaContainerElement) {
        return Promise.resolve(botShieldConfig.identifier);
    }

    /**
     * @returns {null}
     */
    getSupportingCodeToInject() {
        return null;
    }

    /**
     * @param {HTMLElement} captchaContainerElement
     * @returns {boolean}
     */
    canSolve(captchaContainerElement) {
        return getTokenInputs(getDocument(captchaContainerElement)).length > 0;
    }

    /**
     * @param {HTMLElement} captchaContainerElement
     * @param {string} token
     * @returns {PirResponse<{ injected: boolean }>}
     */
    injectToken(captchaContainerElement, token) {
        const tokenInputs = getTokenInputs(getDocument(captchaContainerElement));
        if (tokenInputs.length === 0) {
            return PirError.create('[BotShieldProvider] could not find BotShield token input');
        }

        const failure = tokenInputs
            .map((captchaInputElement) => injectTokenIntoElement({ captchaInputElement, token }))
            .find((response) => PirError.isError(response));
        if (failure) {
            return failure;
        }

        return PirSuccess.create({ injected: true });
    }

    /**
     * @param {HTMLElement} _captchaContainerElement
     * @param {string} _token
     * @returns {PirError | string | null}
     */
    getSolveCallback(_captchaContainerElement, _token) {
        return stringifyFunction({
            functionBody: function botShieldCallbackNoop() {},
            functionName: 'botShieldCallbackNoop',
            args: {},
        });
    }
}
