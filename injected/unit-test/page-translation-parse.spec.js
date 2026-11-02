import { parseTree } from '../src/features/page-translation/parse.js';

/** @typedef {import('../src/features/page-translation/types.js').ParsedNode} ParsedNode */

/** @param {string} text */
const t = (text) => ({ text });
/**
 * A TranslateKit element node.
 * @param {string} tag
 * @param {Record<string, string>} attrs
 * @param {any[]} [children]
 */
const el = (tag, attrs, children = []) => ({ tag, attrs, children });

describe('page-translation parse', () => {
    /** @type {[string, any, boolean, ParsedNode[] | null][]} */
    const cases = [
        [
            'text and an element we sent',
            [t('Le '), el('b', { 'data-t': '0' }, [t('renard')]), t(' rapide')],
            false,
            [{ text: 'Le ' }, { id: 0, children: [{ text: 'renard' }] }, { text: ' rapide' }],
        ],
        ['a void element', [el('br', { 'data-t': '2' }), t('x')], false, [{ id: 2, children: [] }, { text: 'x' }]],
        ['adjacent text merged', [t('a'), t('b')], false, [{ text: 'ab' }]],
        [
            'a wrapped unit',
            [el('div', {}, [el('i', { 'data-t': '0' }, [t('A')]), t('iwa')])],
            true,
            [{ id: 0, children: [{ text: 'A' }] }, { text: 'iwa' }],
        ],
        ['whitespace around the wrapper', [t(' '), el('div', {}, [t('x')]), t('\n')], true, [{ text: 'x' }]],
        ['bidi marks around the wrapper, kept inside', [t('‎'), el('div', {}, [t('x')]), t('‏\n')], true, [{ text: '‎x‏' }]],
        ['two wrappers', [el('div', {}, [t('a')]), el('div', {}, [t('b')])], true, null],
        ['no wrapper', [el('span', { 'data-t': '0' }, [t('A')]), t('iwa')], true, null],
        ['text outside the wrapper', [el('div', {}, [t('x')]), t('y')], true, null],
        ['a wrapper with attributes', [el('div', { class: 'x' }, [t('x')])], true, null],
        ['an element without our id', [el('b', {}, [t('no id')])], false, null],
        ['an id that is not a number', [el('b', { 'data-t': 'x' }, [])], false, null],
        ['attributes besides data-t', [el('img', { 'data-t': '0', src: 'x', onerror: 'y' })], false, null],
        ['a script', [el('script', { 'data-t': '0' }, [t('x')])], false, null],
        ['a nested element without our id', [el('b', { 'data-t': '0' }, [el('i', {}, [t('x')])])], false, null],
        ['not a node', [42], false, null],
    ];

    for (const [name, tree, wrapped, expected] of cases) {
        it(`parses ${name}`, () => {
            expect(parseTree(JSON.stringify(tree), wrapped)).toEqual(expected);
        });
    }

    it("treats TranslateKit's null (malformed HTML) as nothing to write", () => {
        expect(parseTree('null', false)).toBeNull();
    });

    it('rejects JSON that is not an array', () => {
        expect(parseTree('{"text":"x"}', false)).toBeNull();
    });

    it('rejects text that is not JSON', () => {
        expect(parseTree('Le <b data-t="0">renard</b>', false)).toBeNull();
    });
});
