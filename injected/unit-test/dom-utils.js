import { html, trustedUnsafe, createPolicy } from '../src/dom-utils.js';

describe('dom-utils.js - escapedTemplate', () => {
    const tests = [
        { title: 'single', input: () => html`<p>Foo</p>`, expected: '<p>Foo</p>' },
        {
            title: 'siblings',
            input: () =>
                html`<p>Foo</p>
                    <p>Bar</p>`,
            expected: `<p>Foo</p>
                    <p>Bar</p>`,
        },
        { title: 'nested', input: () => html`<div>${html`<p>${'Nested'}</p>`}</div>`, expected: '<div><p>Nested</p></div>' },
        {
            title: 'loop',
            input: () => {
                const items = [{ value: 'foo' }, { value: 'bar' }];
                return html`<h1>Heading</h1>
                    <ul>
                        ${items.map((item) => html`<li>${item.value}</li>`)};
                    </ul>`;
            },
            expected: `<h1>Heading</h1>
                    <ul>
                        <li>foo</li><li>bar</li>;
                    </ul>`,
        },
    ];
    for (const test of tests) {
        it(`should generate ${test.title}`, () => {
            const actual = test.input().toString();
            expect(actual).toEqual(test.expected);
        });
    }

    it('should escape special characters', () => {
        const result = html`<p>${'<script>alert("xss")</script>'}</p>`.toString();
        expect(result).toBe('<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;</p>');
    });

    it('should throw for unknown object types', () => {
        expect(() => html`<p>${{}}</p>`.toString()).toThrowError('Unknown object to escape');
    });
});

describe('dom-utils.js - trustedUnsafe', () => {
    it('should return a Template that does not escape content', () => {
        const result = trustedUnsafe('<b>bold</b>').toString();
        expect(result).toBe('<b>bold</b>');
    });

    it('should allow raw HTML through', () => {
        const result = html`<div>${trustedUnsafe('<script>ok</script>')}</div>`.toString();
        expect(result).toBe('<div><script>ok</script></div>');
    });
});

describe('dom-utils.js - createPolicy', () => {
    it('returns a policy object with createHTML', () => {
        const policy = createPolicy();
        expect(typeof policy.createHTML).toBe('function');
    });

    it('createHTML returns the input string unchanged (fallback)', () => {
        // Without trustedTypes (Node.js environment), the fallback is used
        const policy = createPolicy();
        expect(policy.createHTML('<div>test</div>')).toBe('<div>test</div>');
    });
});
