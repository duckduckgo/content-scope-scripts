import { classify, detectLanguage, looksLikeCode, primaryLanguage } from '../src/features/selection-tools/classify.js';
import { contextMenuActions, directParameter, fits, optionsFor, rankActions } from '../src/features/selection-tools/actions.js';

/**
 * @typedef {import('../src/types/selection-tools.js').SelectionAction} SelectionAction
 * @typedef {import('../src/features/selection-tools/classify.js').SelectionContext} SelectionContext
 */

const english = { userLanguage: 'en-US' };

/** @type {SelectionAction} */
const translate = {
    id: 'translate',
    label: 'Translate',
    parameter: {
        kind: 'language',
        options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
        ],
    },
};
/** @type {SelectionAction} */
const explain = { id: 'explain', label: 'Explain', selectionTypes: ['code', 'text', 'long'] };
/** @type {SelectionAction} */
const define = { id: 'define', label: 'Define', selectionTypes: ['word'] };
/** @type {SelectionAction} */
const fixGrammar = { id: 'fixGrammar', label: 'Fix grammar', editable: true };
/** @type {SelectionAction} */
const summarize = { id: 'summarize', label: 'Summarize', selectionTypes: ['long'] };
/** @type {SelectionAction} */
const tone = {
    id: 'tone',
    label: 'Change tone',
    parameter: {
        kind: 'choice',
        options: [
            { value: 'formal', label: 'Formal' },
            { value: 'casual', label: 'Casual' },
        ],
    },
};

/** @type {SelectionContext} */
const englishText = { shape: 'text', languageTag: 'en', differentLanguage: false, textLength: 40 };
/** @type {SelectionContext} */
const spanishText = { shape: 'text', languageTag: 'es', differentLanguage: true, textLength: 40 };

describe('selectionTools classify', () => {
    it('reads primary language subtags', () => {
        expect(primaryLanguage('es-MX')).toBe('es');
        expect(primaryLanguage('zh_Hant')).toBe('zh');
        expect(primaryLanguage('')).toBeNull();
        expect(primaryLanguage(undefined)).toBeNull();
        expect(primaryLanguage('not a tag')).toBeNull();
    });

    it('detects languages from writing systems and common words', () => {
        expect(detectLanguage('これは日本語の文章です')).toBe('ja');
        expect(detectLanguage('这是一个中文句子')).toBe('zh');
        expect(detectLanguage('Это предложение на русском языке')).toBe('ru');
        expect(detectLanguage('El perro de la casa es muy grande')).toBe('es');
        expect(detectLanguage('The cat is on the mat')).toBe('en');
        expect(detectLanguage('Hello world')).toBeNull();
    });

    it('lets most of the letters decide the writing system', () => {
        expect(detectLanguage('This long English sentence quotes 日本 once and is still English for the reader')).toBe('en');
    });

    it('needs dense signals to call text code', () => {
        expect(looksLikeCode('const x = () => { return 1; };')).toBeTrue();
        expect(looksLikeCode('def add(a, b):\n    return a + b\n    # done')).toBeTrue();
        expect(looksLikeCode('Use a semicolon; it joins two clauses.')).toBeFalse();
    });

    it('classifies selection shapes', () => {
        expect(classify('serendipity', english).shape).toBe('word');
        expect(classify('What time is it?', english).shape).toBe('question');
        expect(classify('A short line of text', english).shape).toBe('text');
        expect(classify('One. Two. Three. Four.', english).shape).toBe('text');
        expect(classify('x'.repeat(500), english).shape).toBe('text');
        expect(classify('x'.repeat(501), english).shape).toBe('long');
        expect(classify('plain words', { ...english, inCodeElement: true }).shape).toBe('code');
    });

    it('calls a single word in another language a word, in that language', () => {
        expect(classify('perro', { ...english, markedLanguage: 'es' })).toEqual({
            shape: 'word',
            languageTag: 'es',
            differentLanguage: true,
            textLength: 5,
        });
    });

    it('leaves out the punctuation a drag picks up around a word', () => {
        for (const text of ['duck,', 'duck.', '(duck)', '"duck"', '«palabra»', '¡hola']) {
            expect(classify(text, english).shape).withContext(text).toBe('word');
        }
    });

    it('keeps a single word with a question mark a question', () => {
        expect(classify('why?', english).shape).toBe('question');
        expect(classify('¿qué?', english).shape).toBe('question');
    });

    it('allows digits and abbreviation dots in a word, but not a bare number', () => {
        for (const text of ['19th', '3D', 'COVID-19', "don't", 'U.S.', 'e.g.']) {
            expect(classify(text, english).shape).withContext(text).toBe('word');
        }
        for (const text of ['2024', '3.14', 'example.com', 'x']) {
            expect(classify(text, english).shape).withContext(text).toBe('text');
        }
    });

    it('takes a long run of a writing system without spaces as text, not a word', () => {
        expect(classify('猫', english).shape).toBe('text');
        expect(classify('日本語', english).shape).toBe('word');
        expect(classify('これは日本語の文章です', english).shape).toBe('text');
    });

    it('marks text in another language, but never code', () => {
        expect(classify('El perro de la casa es muy grande', english)).toEqual({
            shape: 'text',
            languageTag: 'es',
            differentLanguage: true,
            textLength: 33,
        });
        expect(classify('const a = 1; let b = 2; var c = 3;', { userLanguage: 'de' }).differentLanguage).toBeFalse();
    });

    it('falls back to the page marking, then the user language', () => {
        expect(classify('Goedemorgen allemaal', { ...english, markedLanguage: 'nl-NL' }).languageTag).toBe('nl');
        expect(classify('Goedemorgen allemaal', english).languageTag).toBe('en');
    });
});

describe('selectionTools actions', () => {
    it('matches selection types, editability and conditions', () => {
        expect(fits(explain, englishText, false)).toBeTrue();
        expect(fits(define, englishText, false)).toBeFalse();
        expect(fits(fixGrammar, englishText, false)).toBeFalse();
        expect(fits(fixGrammar, englishText, true)).toBeTrue();
        expect(fits({ id: 'x', label: 'X', condition: 'differentLanguage' }, englishText, false)).toBeFalse();
        expect(fits({ id: 'x', label: 'X', condition: 'differentLanguage' }, spanishText, false)).toBeTrue();
    });

    it('counts the trimmed text for length limits', () => {
        expect(classify('  hello world  ', english).textLength).toBe(11);
    });

    it('fits an action only within its inclusive length limits', () => {
        /** @param {number} length */
        const at = (length) => ({ ...englishText, textLength: length });
        /** @type {SelectionAction} */
        const summary = { id: 'summarize', label: 'Summarize', minLength: 150, maxLength: 1499 };
        /** @type {SelectionAction} */
        const keyPoints = { id: 'keyPoints', label: 'Key points', minLength: 1500 };
        /** @type {SelectionAction} */
        const expand = { id: 'expand', label: 'Expand', maxLength: 200 };
        expect([149, 150, 1499, 1500].map((length) => fits(summary, at(length), false))).toEqual([false, true, true, false]);
        expect([1499, 1500, 100000].map((length) => fits(keyPoints, at(length), false))).toEqual([false, true, true]);
        expect([0, 200, 201].map((length) => fits(expand, at(length), false))).toEqual([true, true, false]);
        // Summarize and Key points never both fit.
        for (const length of [149, 150, 1499, 1500]) {
            expect(fits(summary, at(length), false) && fits(keyPoints, at(length), false))
                .withContext(String(length))
                .toBeFalse();
        }
    });

    it('ignores length limits that are not integers', () => {
        for (const limit of [150.5, '150', null, NaN, Infinity, true]) {
            const action = /** @type {SelectionAction} */ (
                /** @type {unknown} */ ({ id: 'x', label: 'X', minLength: limit, maxLength: limit })
            );
            expect(fits(action, { ...englishText, textLength: 1 }, false))
                .withContext(String(limit))
                .toBeTrue();
            expect(fits(action, { ...englishText, textLength: 1000 }, false))
                .withContext(String(limit))
                .toBeTrue();
        }
    });

    it('never matches unknown conditions or a native "ask"', () => {
        const unknown = /** @type {SelectionAction} */ (/** @type {unknown} */ ({ id: 'x', label: 'X', condition: 'somethingNew' }));
        expect(fits(unknown, spanishText, false)).toBeFalse();
        expect(fits({ id: 'ask', label: 'Ask' }, englishText, false)).toBeFalse();
    });

    it('keeps native order, but leads with translation for foreign text', () => {
        const actions = [explain, summarize, translate, tone];
        expect(rankActions(actions, englishText, false).map((a) => a.id)).toEqual(['explain', 'translate', 'tone']);
        expect(rankActions(actions, spanishText, false).map((a) => a.id)).toEqual(['translate', 'explain', 'tone']);
    });

    it('translates foreign text into the user language directly', () => {
        expect(directParameter(translate, spanishText)).toBe('en');
        expect(optionsFor(translate, spanishText)).toEqual([]);
    });

    it('offers other languages for text in the user language', () => {
        expect(directParameter(translate, englishText)).toBeUndefined();
        expect(optionsFor(translate, englishText).map((o) => o.value)).toEqual(['es', 'fr']);
    });

    it('offers every choice for other parameters', () => {
        expect(optionsFor(tone, spanishText).map((o) => o.value)).toEqual(['formal', 'casual']);
        expect(optionsFor(explain, englishText)).toEqual([]);
    });

    it('describes context menu entries', () => {
        expect(contextMenuActions([translate, explain, tone], spanishText)).toEqual([
            { id: 'translate', parameter: 'en' },
            { id: 'explain' },
            { id: 'tone', options: ['formal', 'casual'] },
        ]);
    });
});
