import { JSDOM } from 'jsdom';
import { findClosestAnchor, getSelectedText, extractElementMetadata } from '../src/utils/dom-metadata.js';

/**
 * Helper to set up JSDOM globals for a given HTML fragment.
 * Returns a teardown function that restores the originals.
 *
 * @param {string} html
 */
function setupDom(html) {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
    const origWindow = global.window;
    const origDocument = global.document;
    const origNode = global.Node;
    const origElement = global.Element;
    const origHTMLAnchorElement = global.HTMLAnchorElement;

    global.window = dom.window;
    global.document = dom.window.document;
    global.Node = dom.window.Node;
    global.Element = dom.window.Element;
    global.HTMLAnchorElement = dom.window.HTMLAnchorElement;

    return () => {
        global.window = origWindow;
        global.document = origDocument;
        global.Node = origNode;
        global.Element = origElement;
        global.HTMLAnchorElement = origHTMLAnchorElement;
    };
}

describe('dom-metadata.js', () => {
    // ── findClosestAnchor ──────────────────────────────────────────────

    describe('findClosestAnchor', () => {
        it('returns the anchor when the target is an <a>', () => {
            const teardown = setupDom('<a id="link" href="https://example.com">click</a>');
            try {
                const a = /** @type {HTMLAnchorElement} */ (document.getElementById('link'));
                expect(findClosestAnchor(a)).toBe(a);
            } finally {
                teardown();
            }
        });

        it('returns the ancestor anchor for a nested element', () => {
            const teardown = setupDom('<a id="link" href="https://example.com"><span id="inner">text</span></a>');
            try {
                const span = document.getElementById('inner');
                const a = /** @type {HTMLAnchorElement} */ (document.getElementById('link'));
                expect(findClosestAnchor(span)).toBe(a);
            } finally {
                teardown();
            }
        });

        it('returns null when there is no anchor ancestor', () => {
            const teardown = setupDom('<div id="plain">no link</div>');
            try {
                const div = document.getElementById('plain');
                expect(findClosestAnchor(div)).toBeNull();
            } finally {
                teardown();
            }
        });

        it('returns null for a null target', () => {
            const teardown = setupDom('');
            try {
                expect(findClosestAnchor(null)).toBeNull();
            } finally {
                teardown();
            }
        });

        it('returns null for a non-Element EventTarget', () => {
            const teardown = setupDom('');
            try {
                expect(findClosestAnchor(document)).toBeNull();
            } finally {
                teardown();
            }
        });
    });

    // ── getSelectedText ────────────────────────────────────────────────

    describe('getSelectedText', () => {
        it('returns empty string when no selection exists', () => {
            const teardown = setupDom('<p>hello</p>');
            try {
                expect(getSelectedText()).toBe('');
            } finally {
                teardown();
            }
        });

        it('returns selected text when a range is selected', () => {
            const teardown = setupDom('<p id="p">hello world</p>');
            try {
                const p = /** @type {HTMLElement} */ (document.getElementById('p'));
                const range = document.createRange();
                range.selectNodeContents(p);
                const sel = /** @type {Selection} */ (window.getSelection());
                sel.removeAllRanges();
                sel.addRange(range);

                expect(getSelectedText()).toBe('hello world');
            } finally {
                teardown();
            }
        });
    });

    // ── extractElementMetadata ─────────────────────────────────────────

    describe('extractElementMetadata', () => {
        it('returns empty metadata for null target', () => {
            const teardown = setupDom('');
            try {
                const result = extractElementMetadata(null);
                expect(result).toEqual({ href: null, title: null, alt: null, src: null, tagName: '' });
            } finally {
                teardown();
            }
        });

        it('extracts href from ancestor anchor', () => {
            const teardown = setupDom('<a href="https://example.com"><span id="t">text</span></a>');
            try {
                const el = document.getElementById('t');
                const meta = extractElementMetadata(el);
                expect(meta.href).toBe('https://example.com/');
                expect(meta.tagName).toBe('span');
            } finally {
                teardown();
            }
        });

        it('extracts src and alt from <img>', () => {
            const teardown = setupDom('<img id="img" src="photo.jpg" alt="A photo">');
            try {
                const img = document.getElementById('img');
                const meta = extractElementMetadata(img);
                expect(meta.src).toBe('photo.jpg');
                expect(meta.alt).toBe('A photo');
                expect(meta.tagName).toBe('img');
            } finally {
                teardown();
            }
        });

        it('extracts title from the element itself', () => {
            const teardown = setupDom('<div id="d" title="tooltip">content</div>');
            try {
                const div = document.getElementById('d');
                const meta = extractElementMetadata(div);
                expect(meta.title).toBe('tooltip');
            } finally {
                teardown();
            }
        });

        it('extracts title from ancestor when element has none', () => {
            const teardown = setupDom('<div title="parent-tip"><span id="s">child</span></div>');
            try {
                const span = document.getElementById('s');
                const meta = extractElementMetadata(span);
                expect(meta.title).toBe('parent-tip');
            } finally {
                teardown();
            }
        });

        it('returns null title when no ancestor has a title', () => {
            const teardown = setupDom('<div><span id="s">child</span></div>');
            try {
                const span = document.getElementById('s');
                const meta = extractElementMetadata(span);
                expect(meta.title).toBeNull();
            } finally {
                teardown();
            }
        });

        it('returns null src for non-media elements', () => {
            const teardown = setupDom('<div id="d">text</div>');
            try {
                const div = document.getElementById('d');
                const meta = extractElementMetadata(div);
                expect(meta.src).toBeNull();
            } finally {
                teardown();
            }
        });

        it('extracts src from <video>', () => {
            const teardown = setupDom('<video id="v" src="clip.mp4"></video>');
            try {
                const video = document.getElementById('v');
                const meta = extractElementMetadata(video);
                expect(meta.src).toBe('clip.mp4');
                expect(meta.tagName).toBe('video');
            } finally {
                teardown();
            }
        });

        it('extracts src from <img> inside <picture>', () => {
            const teardown = setupDom('<picture id="pic"><source srcset="large.jpg"><img src="fallback.jpg"></picture>');
            try {
                const picture = document.getElementById('pic');
                const meta = extractElementMetadata(picture);
                expect(meta.src).toBe('fallback.jpg');
                expect(meta.tagName).toBe('picture');
            } finally {
                teardown();
            }
        });

        it('combines anchor href with image src when img is inside a link', () => {
            const teardown = setupDom('<a href="https://example.com"><img id="img" src="photo.jpg" alt="linked image"></a>');
            try {
                const img = document.getElementById('img');
                const meta = extractElementMetadata(img);
                expect(meta.href).toBe('https://example.com/');
                expect(meta.src).toBe('photo.jpg');
                expect(meta.alt).toBe('linked image');
            } finally {
                teardown();
            }
        });
    });
});
