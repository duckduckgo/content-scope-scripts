import { PirError } from '../../types.js';
import { processTemplateStringWithUserData } from '../../actions/build-url-transforms.js';
import { injectTokenIntoElement } from '../utils/token.js';
import { isElementType } from '../utils/element.js';
import { stringifyFunction } from '../utils/stringify-function.js';

/**
 * @import { CaptchaProvider, SiteKeyContext, SiteKeyInfo, SiteKeyProvider } from './provider.interface.js';
 * @import { PirAction, ProfileData } from '../../types.js';
 */

/**
 * Captcha type whose `getCaptchaInfo` action carries a prompt template in `selector` rather than a
 * DOM selector. Android sends a set payload to dbp-api, so reusing `selector` lets us deliver this
 * provider without a native change.
 */
export const PROMPT_CAPTCHA_TYPE = 'llm-prompt';

/**
 * Profile fields a prompt template may reference. The filled-in prompt is sent to dbp-api and on to
 * a third-party LLM, so this is kept to coarse location data; names, phone numbers and street
 * addresses must never be added here.
 */
const ALLOWED_PROMPT_FIELDS = new Set(['city', 'state']);

// Matches both variable forms processTemplateStringWithUserData substitutes, so none can slip past
// the allowlist check.
const TEMPLATE_VARIABLE = /\$%7B(.+?)%7D|\$\{(.+?)}/g;

/**
 * A "captcha" whose site key is a natural-language prompt answered by dbp-api's LLM backend, used
 * for brokers that demand data we don't hold (for example a real ZIP code for the user's city).
 *
 * Unlike every other provider there is nothing to extract from the page: `getCaptchaInfo` builds the
 * prompt from the action's template and the profile via {@link PromptProvider.getCaptchaPrompt}, so
 * `isSupportedForElement` and `getCaptchaIdentifier` deliberately opt out of the DOM pipeline. The
 * solve side is the same as an image captcha: the answer is typed into a text input and no page
 * callback needs to run.
 *
 * @implements {CaptchaProvider}
 * @implements {SiteKeyProvider}
 */
export class PromptProvider {
    getType() {
        return PROMPT_CAPTCHA_TYPE;
    }

    /**
     * @param {SiteKeyContext} context
     * @return {Promise<SiteKeyInfo|PirError>}
     */
    getSiteKey({ action, userData }) {
        const prompt = this.getCaptchaPrompt(action, userData);
        return Promise.resolve(typeof prompt === 'string' ? { siteKey: prompt, type: this.getType() } : prompt);
    }

    /**
     * Prompt captchas are never detected from the DOM, so this provider must not be picked by the
     * factory's detection fallback for some other captcha type.
     *
     * @param {Document | HTMLElement} _root
     * @param {HTMLElement} _captchaContainerElement
     */
    isSupportedForElement(_root, _captchaContainerElement) {
        return false;
    }

    /**
     * @param {HTMLElement} _captchaContainerElement
     * @return {Promise<PirError>}
     */
    getCaptchaIdentifier(_captchaContainerElement) {
        return Promise.resolve(
            PirError.create(
                '[PromptProvider.getCaptchaIdentifier] a prompt is built from the action and profile, not a DOM element; use getCaptchaPrompt',
            ),
        );
    }

    /**
     * Fills a prompt template such as `What is a ZIP code for ${city}, ${state|upcase}?` with the
     * user's profile data, using the same `${field|transform}` syntax as URL building.
     *
     * @param {PirAction} action
     * @param {ProfileData|null} userData
     * @return {string|PirError}
     */
    getCaptchaPrompt(action, userData) {
        const template = action.selector;
        if (!template) {
            return PirError.create('missing prompt template');
        }

        /** @type {Record<string, string|number>} */
        const allowedData = {};
        for (const [, encodedVariable, plainVariable] of template.matchAll(TEMPLATE_VARIABLE)) {
            const [field = ''] = (encodedVariable ?? plainVariable ?? '').split(/\||%7C/);
            if (!ALLOWED_PROMPT_FIELDS.has(field)) {
                return PirError.create(`prompt template references a field that is not allowed: ${field}`);
            }

            const value = userData?.[field];
            if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
                return PirError.create(`profile is missing a value for prompt field: ${field}`);
            }
            allowedData[field] = value;
        }

        return processTemplateStringWithUserData(template, action, allowedData);
    }

    getSupportingCodeToInject() {
        return null;
    }

    /**
     * @param {HTMLElement} captchaInputElement - The input the answer is typed into
     */
    canSolve(captchaInputElement) {
        return isElementType(captchaInputElement, ['input', 'textarea']);
    }

    /**
     * @param {HTMLElement} captchaInputElement - The input the answer is typed into
     * @param {string} token - The LLM's answer
     */
    injectToken(captchaInputElement, token) {
        return injectTokenIntoElement({ captchaInputElement, token });
    }

    /**
     * @param {HTMLElement} _captchaInputElement
     * @param {string} _token
     */
    getSolveCallback(_captchaInputElement, _token) {
        return stringifyFunction({
            functionBody: function callbackNoop() {},
            functionName: 'callbackNoop',
            args: {},
        });
    }
}
