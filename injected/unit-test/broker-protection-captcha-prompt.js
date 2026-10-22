/* eslint-disable no-template-curly-in-string -- prompt templates use the same ${field} syntax as URL templates */
import { buildCaptchaPrompt } from '../src/features/broker-protection/captcha-services/prompt.js';
import { PirError } from '../src/features/broker-protection/types.js';

/**
 * @param {string} selector
 * @return {import('../src/features/broker-protection/types.js').PirAction}
 */
function createPromptAction(selector) {
    return { id: '1', actionType: 'getCaptchaInfo', captchaType: 'llm-prompt', selector };
}

const userProfile = {
    firstName: 'James',
    lastName: 'Daly',
    phone: '5555555555',
    city: 'austin',
    state: 'TX',
    zip: '78701',
};

describe('buildCaptchaPrompt', () => {
    it('fills allowlisted fields from the profile', () => {
        const prompt = buildCaptchaPrompt(createPromptAction('ZIP code for ${city}, ${state|upcase}?'), userProfile);
        expect(prompt).toBe('ZIP code for Austin, TX?');
    });

    it('applies the same transforms as URL building', () => {
        const prompt = buildCaptchaPrompt(createPromptAction('${city} in ${state|stateFull} near ${zip}'), userProfile);
        expect(prompt).toBe('Austin in Texas near 78701');
    });

    it('returns a template with no variables unchanged', () => {
        expect(buildCaptchaPrompt(createPromptAction('What is 2 + 2?'), userProfile)).toBe('What is 2 + 2?');
    });

    it('rejects a template that references a field outside the allowlist', () => {
        const prompt = buildCaptchaPrompt(createPromptAction('Hello ${firstName} from ${city}'), userProfile);
        expect(PirError.isError(prompt)).toBeTrue();
        expect(/** @type {PirError} */ (prompt).error.message).toContain('firstName');
    });

    it('rejects a disallowed field even when it is combined with a transform', () => {
        const prompt = buildCaptchaPrompt(createPromptAction('${phone|upcase}'), userProfile);
        expect(PirError.isError(prompt)).toBeTrue();
    });

    it('rejects a disallowed field written in the URL-encoded variable form', () => {
        const prompt = buildCaptchaPrompt(createPromptAction('$%7BfirstName%7D in ${city}'), userProfile);
        expect(PirError.isError(prompt)).toBeTrue();
    });

    it('rejects a template when the profile has no value for a referenced field', () => {
        const prompt = buildCaptchaPrompt(createPromptAction('ZIP near ${zip}'), { ...userProfile, zip: '' });
        expect(PirError.isError(prompt)).toBeTrue();
        expect(/** @type {PirError} */ (prompt).error.message).toContain('zip');
    });

    it('rejects a template when there is no profile', () => {
        expect(PirError.isError(buildCaptchaPrompt(createPromptAction('${city}'), null))).toBeTrue();
    });

    it('rejects an action with no template', () => {
        expect(PirError.isError(buildCaptchaPrompt(createPromptAction(''), userProfile))).toBeTrue();
    });
});
