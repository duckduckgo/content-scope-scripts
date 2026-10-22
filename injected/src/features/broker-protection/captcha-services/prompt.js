import { PirError } from '../types.js';
import { processTemplateStringWithUserData } from '../actions/build-url-transforms.js';

/**
 * @import { PirAction, ProfileData } from '../types.js'
 */

/**
 * Captcha type whose `getCaptchaInfo` action carries a prompt template in `selector` rather than a
 * DOM selector. Android re-serializes actions from a fixed model, so `selector` is the only free-form
 * string field that reaches us unchanged on every platform.
 */
export const PROMPT_CAPTCHA_TYPE = 'llm-prompt';

/**
 * Profile fields a prompt template may reference. The filled-in prompt is sent to dbp-api and on to
 * a third-party LLM, so this is kept to coarse location data; names, phone numbers and street
 * addresses must never be added here.
 */
const ALLOWED_PROMPT_FIELDS = new Set(['city', 'state', 'zip']);

// Matches both variable forms processTemplateStringWithUserData substitutes, so none can slip past
// the allowlist check.
const TEMPLATE_VARIABLE = /\$%7B(.+?)%7D|\$\{(.+?)}/g;

/**
 * Fills a prompt template such as `What is a ZIP code for ${city}, ${state|upcase}?` with the user's
 * profile data, using the same `${field|transform}` syntax as URL building.
 *
 * @param {PirAction} action
 * @param {ProfileData|null} userData
 * @return {string|PirError}
 */
export function buildCaptchaPrompt(action, userData) {
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
