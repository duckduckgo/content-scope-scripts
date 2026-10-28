import { JSDOM } from 'jsdom';
import { parseOwn, fromDocument } from '../src/features/page-translation/parse.js';

const JSDOMParser = new JSDOM().window.DOMParser;

/**
 * @param {string} text
 * @param {boolean} wrapped
 */
const viaDocument = (text, wrapped) => fromDocument(new JSDOMParser().parseFromString(text, 'text/html').body, wrapped);

describe('page-translation parse', () => {
    /** @type {[string, boolean, import('../src/features/page-translation/types.js').ParsedNode[] | null][]} */
    const bothPaths = [
        ['Le <b data-t="0">renard</b> rapide', false, [{ text: 'Le ' }, { id: 0, children: [{ text: 'renard' }] }, { text: ' rapide' }]],
        ['a &amp; b &lt; c &#8217; &#x41; &nbsp;x &foo;', false, [{ text: 'a & b < c ’ A  x &foo;' }]],
        ['<br data-t="2">x', false, [{ id: 2, children: [] }, { text: 'x' }]],
        ['<div><i data-t="0">A</i>iwa</div>', true, [{ id: 0, children: [{ text: 'A' }] }, { text: 'iwa' }]],
        [' <div>x</div>\n', true, [{ text: 'x' }]],
        ['<div>a</div><div>b</div>', true, null],
        ['<span data-t="0">A</span>iwa', true, null],
        ['<b>no id</b>', false, null],
        ['<script data-t="0">x</script>', false, null],
        ['<img data-t="0" src=x onerror="y">', false, null],
    ];

    for (const [input, wrapped, expected] of bothPaths) {
        it(`parses ${JSON.stringify(input)} (wrapped: ${wrapped}) the same way on both paths`, () => {
            expect(parseOwn(input, wrapped)).toEqual(expected);
            expect(viaDocument(input, wrapped)).toEqual(expected);
        });
    }

    it('rejects an unclosed tag', () => {
        expect(parseOwn('<b data-t="0">unclosed', false)).toBeNull();
    });

    it('rejects a mismatched closing tag', () => {
        expect(parseOwn('<b data-t="0"></i>', false)).toBeNull();
    });

    it('rejects a stray less-than sign', () => {
        expect(parseOwn('a < b', false)).toBeNull();
    });

    it('accepts a raw greater-than sign in text', () => {
        expect(parseOwn('a > b', false)).toEqual([{ text: 'a > b' }]);
    });
});
