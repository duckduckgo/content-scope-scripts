/* eslint-disable no-template-curly-in-string -- prompt templates use the same ${field} syntax as URL templates */
import { JSDOM } from 'jsdom';
import { PromptProvider, PROMPT_CAPTCHA_TYPE } from '../src/features/broker-protection/captcha-services/providers/prompt.js';
import { PirError } from '../src/features/broker-protection/types.js';

// The solve side touches real elements, so give the specs a document without polluting globals.
const { document: testDocument } = new JSDOM('<!DOCTYPE html>').window;

/**
 * @param {string} selector
 * @return {import('../src/features/broker-protection/types.js').PirAction}
 */
function createPromptAction(selector) {
    return { id: '1', actionType: 'getCaptchaInfo', captchaType: PROMPT_CAPTCHA_TYPE, selector };
}

const userProfile = {
    firstName: 'James',
    lastName: 'Daly',
    phone: '5555555555',
    city: 'austin',
    state: 'TX',
    zip: '78701',
};

describe('PromptProvider', () => {
    const provider = new PromptProvider();

    describe('extract side', () => {
        it('reports the llm-prompt type', () => {
            expect(provider.getType()).toBe('llm-prompt');
        });

        it('is never detected from a DOM element', () => {
            expect(provider.isSupportedForElement(testDocument, testDocument.createElement('img'))).toBeFalse();
            expect(provider.isSupportedForElement(testDocument, testDocument.createElement('input'))).toBeFalse();
        });

        it('refuses to build an identifier from a DOM element', async () => {
            const identifier = await provider.getCaptchaIdentifier(testDocument.createElement('div'));
            expect(PirError.isError(identifier)).toBeTrue();
        });

        it('has no supporting code to inject', () => {
            expect(provider.getSupportingCodeToInject()).toBeNull();
        });
    });

    describe('getCaptchaPrompt', () => {
        it('fills allowlisted fields from the profile', () => {
            const prompt = provider.getCaptchaPrompt(createPromptAction('ZIP code for ${city}, ${state|upcase}?'), userProfile);
            expect(prompt).toBe('ZIP code for Austin, TX?');
        });

        it('applies the same transforms as URL building', () => {
            const prompt = provider.getCaptchaPrompt(createPromptAction('${city} in ${state|stateFull} near ${zip}'), userProfile);
            expect(prompt).toBe('Austin in Texas near 78701');
        });

        it('returns a template with no variables unchanged', () => {
            expect(provider.getCaptchaPrompt(createPromptAction('What is 2 + 2?'), userProfile)).toBe('What is 2 + 2?');
        });

        it('rejects a template that references a field outside the allowlist', () => {
            const prompt = provider.getCaptchaPrompt(createPromptAction('Hello ${firstName} from ${city}'), userProfile);
            expect(PirError.isError(prompt)).toBeTrue();
            expect(/** @type {PirError} */ (prompt).error.message).toContain('firstName');
        });

        it('rejects a disallowed field even when it is combined with a transform', () => {
            const prompt = provider.getCaptchaPrompt(createPromptAction('${phone|upcase}'), userProfile);
            expect(PirError.isError(prompt)).toBeTrue();
        });

        it('rejects a disallowed field written in the URL-encoded variable form', () => {
            const prompt = provider.getCaptchaPrompt(createPromptAction('$%7BfirstName%7D in ${city}'), userProfile);
            expect(PirError.isError(prompt)).toBeTrue();
        });

        it('rejects a template when the profile has no value for a referenced field', () => {
            const prompt = provider.getCaptchaPrompt(createPromptAction('ZIP near ${zip}'), { ...userProfile, zip: '' });
            expect(PirError.isError(prompt)).toBeTrue();
            expect(/** @type {PirError} */ (prompt).error.message).toContain('zip');
        });

        it('rejects a template when there is no profile', () => {
            expect(PirError.isError(provider.getCaptchaPrompt(createPromptAction('${city}'), null))).toBeTrue();
        });

        it('rejects an action with no template', () => {
            expect(PirError.isError(provider.getCaptchaPrompt(createPromptAction(''), userProfile))).toBeTrue();
        });
    });

    describe('solve side', () => {
        it('can solve into a text input or textarea only', () => {
            expect(provider.canSolve(testDocument.createElement('input'))).toBeTrue();
            expect(provider.canSolve(testDocument.createElement('textarea'))).toBeTrue();
            expect(provider.canSolve(testDocument.createElement('div'))).toBeFalse();
        });

        it('types the answer into the input', () => {
            const input = testDocument.createElement('input');
            input.type = 'text';

            const result = provider.injectToken(input, '78701');

            expect(PirError.isError(result)).toBeFalse();
            expect(input.value).toBe('78701');
        });

        it('returns a no-op page callback', () => {
            const callback = provider.getSolveCallback(testDocument.createElement('input'), '78701');
            expect(typeof callback).toBe('string');
            expect(callback).toContain('callbackNoop');
        });
    });
});
