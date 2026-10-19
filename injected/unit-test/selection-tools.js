import { classify, detectLanguage, looksLikeCode, primaryLanguage } from '../src/features/selection-tools/classify.js';
import {
    contextMenuActions,
    directParameter,
    fits,
    optionsFor,
    rankActions,
    splitForToolbar,
} from '../src/features/selection-tools/actions.js';
import { menuPosition, submenuPosition, toolbarPosition } from '../src/features/selection-tools/placement.js';

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
const englishText = { shape: 'text', languageTag: 'en', differentLanguage: false };
/** @type {SelectionContext} */
const spanishText = { shape: 'text', languageTag: 'es', differentLanguage: true };

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
        expect(classify('One. Two. Three. Four.', english).shape).toBe('long');
        expect(classify('x'.repeat(300), english).shape).toBe('long');
        expect(classify('plain words', { ...english, inCodeElement: true }).shape).toBe('code');
    });

    it('does not call a foreign single word a word', () => {
        expect(classify('perro', { ...english, markedLanguage: 'es' }).shape).toBe('text');
    });

    it('marks text in another language, but never code', () => {
        expect(classify('El perro de la casa es muy grande', english)).toEqual({
            shape: 'text',
            languageTag: 'es',
            differentLanguage: true,
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

    it('counts Ask among the visible toolbar slots', () => {
        const ranked = [1, 2, 3, 4, 5, 6];
        expect(splitForToolbar(ranked, 5)).toEqual({ visible: [1, 2, 3, 4], overflow: [5, 6] });
        expect(splitForToolbar(ranked, 1)).toEqual({ visible: [], overflow: ranked });
    });

    it('describes context menu entries', () => {
        expect(contextMenuActions([translate, explain, tone], spanishText)).toEqual([
            { id: 'translate', parameter: 'en' },
            { id: 'explain' },
            { id: 'tone', options: ['formal', 'casual'] },
        ]);
    });
});

describe('selectionTools placement', () => {
    const viewport = { width: 1000, height: 800 };
    const toolbar = { width: 300, height: 36 };

    it('sits above the selection, aligned with its start', () => {
        expect(toolbarPosition({ left: 100, top: 300, right: 400, bottom: 320 }, toolbar, viewport)).toEqual({
            left: 100,
            top: 256,
            visible: true,
        });
    });

    it('goes below a selection at the top of the viewport', () => {
        expect(toolbarPosition({ left: 100, top: 10, right: 400, bottom: 30 }, toolbar, viewport).top).toBe(38);
    });

    it('floats near the bottom for a selection running past it', () => {
        expect(toolbarPosition({ left: 100, top: 20, right: 400, bottom: 2000 }, toolbar, viewport).top).toBe(726);
    });

    it('stays inside the viewport horizontally', () => {
        expect(toolbarPosition({ left: 900, top: 300, right: 990, bottom: 320 }, toolbar, viewport).left).toBe(692);
    });

    it('is hidden while the selection is scrolled out of view', () => {
        expect(toolbarPosition({ left: 100, top: -200, right: 400, bottom: -180 }, toolbar, viewport).visible).toBeFalse();
    });

    it('opens menus below the toolbar, or above when there is no room', () => {
        const button = { left: 200, top: 256, right: 240, bottom: 292 };
        const bar = { left: 100, top: 256, right: 400, bottom: 292 };
        expect(menuPosition(button, bar, { width: 170, height: 100 }, viewport)).toEqual({ left: 196, top: 296 });
        const low = { left: 100, top: 740, right: 400, bottom: 776 };
        expect(menuPosition({ ...button, top: 740, bottom: 776 }, low, { width: 170, height: 100 }, viewport).top).toBe(636);
    });

    it('opens submenus on the right, or the left near the edge', () => {
        const item = { left: 600, top: 300, right: 770, bottom: 330 };
        const menu = { left: 600, top: 296, right: 770, bottom: 400 };
        expect(submenuPosition(item, menu, { width: 170, height: 60 }, viewport)).toEqual({ left: 774, top: 296 });
        const nearEdge = { left: 760, top: 296, right: 930, bottom: 400 };
        expect(submenuPosition({ ...item, left: 760, right: 930 }, nearEdge, { width: 170, height: 60 }, viewport).left).toBe(586);
    });
});
