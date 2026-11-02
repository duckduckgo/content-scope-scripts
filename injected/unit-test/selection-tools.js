import { classify, detectLanguage, looksLikeCode, primaryLanguage } from '../src/features/selection-tools/classify.js';
import { selectedTextKey } from '../src/features/selection-tools/text-key.js';

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

    it('tells Cyrillic languages apart, and names none it cannot', () => {
        expect(detectLanguage('Це речення українською мовою, і воно не російське')).toBe('uk');
        expect(detectLanguage('Гэта сказ па-беларуску і ён не рускі')).toBe('be');
        expect(detectLanguage('Я ўчора чытаў кнігу')).toBe('be');
        expect(detectLanguage('Ово је реченица на српском језику')).toBe('sr');
        expect(detectLanguage('Он сказал, что придет завтра')).toBe('ru');
        // Bulgarian has no letters of its own.
        expect(detectLanguage('Това е изречение на български език')).toBeNull();
    });

    it('names no listed language for Latin text with letters outside its alphabet', () => {
        expect(detectLanguage('To jest zdanie po polsku i to nie jest angielski, w ogóle')).toBeNull();
        expect(detectLanguage('Tohle je věta v češtině a to není angličtina')).toBeNull();
        expect(detectLanguage('Le café est sur la table et il est chaud')).toBe('fr');
        expect(detectLanguage('Die Straße ist lang und das Wetter ist schön')).toBe('de');
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
        expect(classify('serendipity').shape).toBe('word');
        expect(classify('What time is it?').shape).toBe('question');
        expect(classify('A short line of text').shape).toBe('text');
        expect(classify('One. Two. Three. Four.').shape).toBe('text');
        expect(classify('x'.repeat(500)).shape).toBe('text');
        expect(classify('x'.repeat(501)).shape).toBe('long');
        expect(classify('plain words', { inCodeElement: true }).shape).toBe('code');
    });

    it('calls a single word in another language a word, in that language', () => {
        expect(classify('perro', { markedLanguage: 'es' })).toEqual({ shape: 'word', language: 'es' });
    });

    it('leaves out the punctuation a drag picks up around a word', () => {
        for (const text of ['duck,', 'duck.', '(duck)', '"duck"', '«palabra»', '¡hola']) {
            expect(classify(text).shape).withContext(text).toBe('word');
        }
    });

    it('keeps a single word with a question mark a question', () => {
        expect(classify('why?').shape).toBe('question');
        expect(classify('¿qué?').shape).toBe('question');
    });

    it('allows digits and abbreviation dots in a word, but not a bare number', () => {
        for (const text of ['19th', '3D', 'COVID-19', "don't", 'U.S.', 'e.g.']) {
            expect(classify(text).shape).withContext(text).toBe('word');
        }
        for (const text of ['2024', '3.14', 'example.com', 'x']) {
            expect(classify(text).shape).withContext(text).toBe('text');
        }
    });

    it('takes a long run of a writing system without spaces as text, not a word', () => {
        expect(classify('猫').shape).toBe('text');
        expect(classify('日本語').shape).toBe('word');
        expect(classify('これは日本語の文章です').shape).toBe('text');
    });

    it('names the language the text is in', () => {
        expect(classify('El perro de la casa es muy grande')).toEqual({ shape: 'text', language: 'es' });
    });

    it('falls back to the page marking, and otherwise leaves the language unknown', () => {
        expect(classify('Goedemorgen allemaal', { markedLanguage: 'nl-NL' }).language).toBe('nl');
        expect(classify('Goedemorgen allemaal').language).toBeNull();
    });
});

describe('selectionTools selectedTextKey', () => {
    it('is the 32-bit FNV-1a hash as 8 hex digits', () => {
        // Published FNV-1a test vectors; ASCII code units hash the same as bytes.
        expect(selectedTextKey('')).toBe('811c9dc5');
        expect(selectedTextKey('a')).toBe('e40c292c');
        expect(selectedTextKey('foobar')).toBe('bf9cf968');
    });

    it('ignores how the whitespace is laid out', () => {
        expect(selectedTextKey('  The quick\n\tbrown\u00a0 fox ')).toBe(selectedTextKey('The quick brown fox'));
        expect(selectedTextKey('The quick brown fox')).not.toBe(selectedTextKey('The quick brown fax'));
    });

    it('hashes UTF-16 code units', () => {
        // "é" is the one code unit 0xe9, not its two UTF-8 bytes.
        expect(selectedTextKey('\u00e9')).toBe('6c0b6c44');
    });
});
