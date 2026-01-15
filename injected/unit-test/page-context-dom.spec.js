import { JSDOM } from 'jsdom';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { domToMarkdown, checkNodeIsVisible } from '../src/features/page-context.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);

/**
 * @typedef {Object} DomToMarkdownSettings
 * @property {number} maxLength - Maximum length of content
 * @property {number} maxDepth - Maximum depth to traverse
 * @property {string} excludeSelectors - CSS selectors to exclude from processing
 * @property {boolean} includeIframes - Whether to include iframe content
 * @property {boolean} trimBlankLinks - Whether to trim blank links
 */

describe('page-context.js - domToMarkdown', () => {
    const fixturesDir = join(currentDirname, 'fixtures', 'page-context');
    const outputDir = join(fixturesDir, 'output');

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    const defaultSettings = { maxLength: 10000, maxDepth: 100, excludeSelectors: null, includeIframes: false, trimBlankLinks: false };

    const testCases = [
        {
            name: 'simple-paragraph',
            html: '<p>This is a simple paragraph.</p>',
            settings: defaultSettings,
        },
        {
            name: 'multiple-paragraphs',
            html: '<p>First paragraph.</p><p>Second paragraph.</p><p>Third paragraph.</p>',
            settings: defaultSettings,
        },
        {
            name: 'headings',
            html: '<h1>Main Heading</h1><h2>Subheading</h2><h3>Sub-subheading</h3>',
            settings: defaultSettings,
        },
        {
            name: 'bold-and-italic',
            html: '<p>This is <strong>bold</strong> and this is <em>italic</em>.</p>',
            settings: defaultSettings,
        },
        {
            name: 'links',
            html: '<p>Visit <a href="https://example.com">our website</a> for more info.</p>',
            settings: defaultSettings,
        },
        {
            name: 'unordered-list',
            html: '<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>',
            settings: defaultSettings,
        },
        {
            name: 'ordered-list',
            html: '<ol><li>First step</li><li>Second step</li><li>Third step</li></ol>',
            settings: defaultSettings,
        },
        {
            name: 'nested-lists',
            html: '<ul><li>Item 1<ul><li>Subitem 1.1</li><li>Subitem 1.2</li></ul></li><li>Item 2</li></ul>',
            settings: defaultSettings,
        },
        {
            name: 'image',
            html: '<img src="photo.jpg" alt="A beautiful landscape">',
            settings: defaultSettings,
        },
        {
            name: 'line-breaks',
            html: '<p>First line<br>Second line<br>Third line</p>',
            settings: defaultSettings,
        },
        {
            name: 'complex-nested',
            html: '<div><h1>Article Title</h1><p>Introduction paragraph.</p><h2>Section 1</h2><p>Section content with <strong>bold</strong> text.</p></div>',
            settings: defaultSettings,
        },
        {
            name: 'whitespace-handling',
            html: '<p>Text   with   multiple   spaces</p>',
            settings: defaultSettings,
        },
        {
            name: 'hidden-content',
            html: '<div><p>Visible text</p><p style="display: none;">Hidden text</p></div>',
            settings: defaultSettings,
        },
        {
            name: 'excluded-selectors',
            html: '<div><p>Keep this</p><div class="ad">Remove this ad</div><p>Keep this too</p></div>',
            settings: { maxLength: 10000, maxDepth: 100, excludeSelectors: '.ad', includeIframes: false, trimBlankLinks: false },
        },
        {
            name: 'max-length-truncation',
            html: '<p>This is a very long paragraph that should be truncated at the maximum length setting.</p>',
            settings: { maxLength: 30, maxDepth: 100, excludeSelectors: null, includeIframes: false, trimBlankLinks: false },
        },
        {
            name: 'empty-link-with-trim',
            html: '<a href="https://example.com"></a>',
            settings: { maxLength: 10000, maxDepth: 100, excludeSelectors: null, includeIframes: false, trimBlankLinks: true },
        },
        {
            name: 'empty-link-without-trim',
            html: '<a href="https://example.com"></a>',
            settings: { maxLength: 10000, maxDepth: 100, excludeSelectors: null, includeIframes: false, trimBlankLinks: false },
        },
        {
            name: 'mixed-formatting',
            html: '<p>This has <strong><em>bold and italic</em></strong> together.</p>',
            settings: defaultSettings,
        },
        {
            name: 'article-structure',
            html: `<article>
                <h1>Article Title</h1>
                <p>By <strong>Author Name</strong></p>
                <p>This is the introduction paragraph with some <em>emphasis</em>.</p>
                <h2>First Section</h2>
                <p>Content of the first section.</p>
                <ul>
                    <li>Point one</li>
                    <li>Point two</li>
                </ul>
                <h2>Second Section</h2>
                <p>Content with a <a href="https://example.com">link</a>.</p>
            </article>`,
            settings: defaultSettings,
        },
        {
            name: 'blog-post',
            html: `<main>
                <h1>Blog Post Title</h1>
                <p>Published on January 1, 2024</p>
                <img src="header.jpg" alt="Header image">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <h2>Key Takeaways</h2>
                <ol>
                    <li>First takeaway</li>
                    <li>Second takeaway</li>
                    <li>Third takeaway</li>
                </ol>
                <p>Read more on <a href="https://blog.example.com">our blog</a>.</p>
            </main>`,
            settings: defaultSettings,
        },
    ];

    for (const testCase of testCases) {
        it(`should convert ${testCase.name} to markdown`, () => {
            // Create a JSDOM instance
            const dom = new JSDOM(`<!DOCTYPE html><html><body>${testCase.html}</body></html>`);
            const { window } = dom;
            const { document } = window;

            // Save original globals
            const originalWindow = global.window;
            const originalNode = global.Node;

            // Set up global window and Node for the imported function
            global.window = window;
            global.Node = window.Node;

            try {
                // Convert to markdown
                const markdown = domToMarkdown(document.body, testCase.settings, 0).trim();

                // Write output file
                const outputFile = join(outputDir, `${testCase.name}.md`);
                writeFileSync(outputFile, markdown, 'utf8');

                // Check if expected file exists
                const expectedFile = join(fixturesDir, 'expected', `${testCase.name}.md`);
                if (existsSync(expectedFile)) {
                    const expected = readFileSync(expectedFile, 'utf8').trim();
                    expect(markdown).toEqual(expected);
                } else {
                    // On first run, we'll just generate the output files
                    // User needs to review and move them to expected/ directory
                    console.log(`Generated output for ${testCase.name} - review and move to expected/`);
                }
            } finally {
                // Restore original globals
                global.window = originalWindow;
                global.Node = originalNode;
            }
        });
    }
});

describe('page-context.js - checkNodeIsVisible', () => {
    /**
     * Helper to create a JSDOM environment and test visibility
     * @param {string} html - HTML content
     * @param {string} selector - CSS selector for the element to test
     * @returns {boolean} - Result of checkNodeIsVisible
     */
    function testVisibility(html, selector) {
        const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
        const { window } = dom;
        const element = window.document.querySelector(selector);

        // Save and set globals
        const originalWindow = global.window;
        global.window = window;

        try {
            return checkNodeIsVisible(element);
        } finally {
            global.window = originalWindow;
        }
    }

    it('should return true for visible elements', () => {
        expect(testVisibility('<div id="test">Visible</div>', '#test')).toBe(true);
    });

    it('should return false for display:none elements', () => {
        expect(testVisibility('<div id="test" style="display: none;">Hidden</div>', '#test')).toBe(false);
    });

    it('should return false for visibility:hidden elements', () => {
        expect(testVisibility('<div id="test" style="visibility: hidden;">Hidden</div>', '#test')).toBe(false);
    });

    it('should return false for opacity:0 elements', () => {
        expect(testVisibility('<div id="test" style="opacity: 0;">Hidden</div>', '#test')).toBe(false);
    });

    it('should return true for opacity:0.5 elements', () => {
        expect(testVisibility('<div id="test" style="opacity: 0.5;">Visible</div>', '#test')).toBe(true);
    });

    it('should return true for opacity:1 elements', () => {
        expect(testVisibility('<div id="test" style="opacity: 1;">Visible</div>', '#test')).toBe(true);
    });

    it('should return true for elements with other display values', () => {
        expect(testVisibility('<div id="test" style="display: block;">Visible</div>', '#test')).toBe(true);
        expect(testVisibility('<span id="test" style="display: inline;">Visible</span>', '#test')).toBe(true);
    });

    it('should return true for elements with visibility:visible', () => {
        expect(testVisibility('<div id="test" style="visibility: visible;">Visible</div>', '#test')).toBe(true);
    });

    it('should return false when getComputedStyle throws', () => {
        const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test">Test</div></body></html>');
        const { window } = dom;

        // Save original
        const originalWindow = global.window;

        // Create a mock window that throws on getComputedStyle
        // @ts-expect-error - intentionally partial mock for error handling test
        global.window = {
            getComputedStyle: () => {
                throw new Error('Simulated error');
            },
        };

        try {
            const element = window.document.querySelector('#test');
            expect(checkNodeIsVisible(element)).toBe(false);
        } finally {
            global.window = originalWindow;
        }
    });
});
