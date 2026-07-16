import { JSDOM } from 'jsdom';
import { fillMany } from '../src/features/broker-protection/actions/fill-form.js';

describe('broker protection fillForm address fields', () => {
    /** @type {JSDOM} */
    let dom;
    const originalWindow = globalThis.window;
    const originalEvent = globalThis.Event;

    beforeEach(() => {
        dom = new JSDOM('<form><input id="street"><input id="zip"></form>');
        globalThis.window = /** @type {any} */ (dom.window);
        globalThis.Event = dom.window.Event;
    });

    afterEach(() => {
        globalThis.window = originalWindow;
        globalThis.Event = originalEvent;
        dom.window.close();
    });

    it('fills the real street and zip from an extracted profile', () => {
        const form = /** @type {HTMLElement} */ (dom.window.document.querySelector('form'));
        const results = fillMany(
            form,
            [
                { selector: '#street', type: 'street' },
                { selector: '#zip', type: 'zipCode' },
            ],
            {
                street: '123 N Main St Apt 4',
                zipCode: '60602',
            },
        );

        expect(results).toEqual([{ result: true }, { result: true }]);
        expect(/** @type {HTMLInputElement} */ (form.querySelector('#street')).value).toBe('123 N Main St Apt 4');
        expect(/** @type {HTMLInputElement} */ (form.querySelector('#zip')).value).toBe('60602');
    });

    it('uses generated fallbacks when the extracted address is missing', () => {
        const form = /** @type {HTMLElement} */ (dom.window.document.querySelector('form'));
        const results = fillMany(
            form,
            [
                { selector: '#street', type: 'street' },
                { selector: '#zip', type: 'zipCode' },
            ],
            {},
        );

        expect(results).toEqual([{ result: true }, { result: true }]);
        expect(/** @type {HTMLInputElement} */ (form.querySelector('#street')).value).toMatch(/^\d+ [A-Za-z]+(?: [A-Za-z]+)?$/);
        expect(/** @type {HTMLInputElement} */ (form.querySelector('#zip')).value).toMatch(/^\d{5}$/);
    });

    it('keeps the existing missing-data error for other field mappings', () => {
        const form = /** @type {HTMLElement} */ (dom.window.document.querySelector('form'));
        const results = fillMany(form, [{ selector: '#street', type: 'email' }], {});

        expect(results).toEqual([
            {
                result: false,
                error: "element found with selector '#street', but data didn't contain the key 'email'",
            },
        ]);
        expect(/** @type {HTMLInputElement} */ (form.querySelector('#street')).value).toBe('');
    });
});
