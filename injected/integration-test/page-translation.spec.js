import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { ResultsCollector } from './page-objects/results-collector.js';

const PAGES = '/page-translation/pages';
const CONFIG = './integration-test/test-pages/page-translation/config/page-translation.json';

/**
 * @typedef {{ id: number, text: string, html: boolean, vp: 0 | 1 }} Unit
 * @typedef {{ id: number, text?: string, tree?: string }} Update - `text` for plain units, `tree` (TranslateKit's JSON) for HTML units
 * @typedef {object} Fixture
 * @property {string} page
 * @property {string[]} units - each unit's plain text, in document order
 * @property {string[]} [untranslated] - selectors whose text must stay as it is
 * @property {number} [skipped] - units apply leaves alone (marked as another language)
 */

/** @type {Fixture[]} */
const FIXTURES = [
    {
        page: 'article.html',
        units: [
            'Scientists map the deep ocean floor',
            'The new survey covers two million square kilometres, and the full data set is public.',
            'First finding',
            'Second finding',
            'We were surprised by how much we did not know.',
            'This paragraph is below the fold.',
        ],
    },
    {
        page: 'drop-cap.html',
        units: ['Aiwa is the first word, and the whole paragraph must stay one unit.', 'The second paragraph has no drop cap.'],
    },
    {
        page: 'form.html',
        units: ['Sign in to your account', 'Email address', 'Password', 'We never share your email.', 'Sign in'],
    },
    {
        page: 'nested-block-link.html',
        units: ['Harbour reopens after storm repairs', 'Library extends its opening hours'],
    },
    {
        page: 'html-like-text.html',
        units: ['Posted comment: <img src=x onerror="window.injected = true">'],
    },
    {
        page: 'opt-outs.html',
        units: ['Run the command below to install it.', 'Use to check your changes.'],
        untranslated: ['pre', 'code', 'kbd', '[translate="no"]', '.notranslate', '[contenteditable]'],
    },
    {
        page: 'table.html',
        units: ['Name', 'Notes', 'Ada wrote the first program.', 'Mathematician'],
    },
    {
        page: 'nav.html',
        units: ['Home World news', 'Footer note'],
    },
    {
        // Everything is extracted; apply leaves the French parts alone.
        page: 'lang.html',
        units: ['Untagged paragraph.', 'Une citation en français.', 'British colour.', 'Encore du français.', 'He said bonjour to us.'],
        untranslated: ['[lang="fr"]', '[lang="FR-ca"]'],
        skipped: 2,
    },
    {
        page: 'soft-hyphen.html',
        units: ['Die Bundesregierung tagt.'],
    },
    {
        page: 'select.html',
        units: ['Size', 'Small', 'Medium', 'Large'],
    },
    {
        page: 'nested.html',
        units: ['Read the full story here.'],
    },
    {
        page: 'style-child.html',
        units: ['Hello there friend.'],
    },
    {
        page: 'citation.html',
        units: ['Joy is a feeling[9] of happiness.', 'The study[1] was small.'],
    },
    {
        page: 'hidden.html',
        units: [
            'Visible paragraph.',
            'Hidden menu item',
            'Hidden by attribute.',
            'Invisible paragraph.',
            'Faded paragraph.',
            'Show more',
            'Collapsed answer.',
            'Hidden inline text',
            'Read the hidden part later.',
            'Shipping address',
            'Street',
        ],
    },
    {
        page: 'attributes.html',
        units: ['Birds', 'Population', 'Page about birds.', 'A small bird', 'Read about birds', 'Pop.', 'First choice'],
    },
    {
        page: 'react.html',
        units: ['hey you this has accrued 150 spaceships pay now', 'Add one'],
    },
    {
        page: 'datalist.html',
        units: ['Color', 'Red', 'Blue'],
    },
    {
        page: 'mixed-container.html',
        units: ['Intro text sits directly in the container.', 'And this is a normal paragraph.'],
    },
];

/**
 * Stands in for the engine: marks every text run as ‹translated› and keeps tags and entities as they are,
 * so a test can find text that was never translated. Runs of whitespace or symbols are left alone.
 * shortcut: splits on `<…>`, so a `>` inside an attribute value breaks it; use a real parser if a fixture needs one.
 * @param {string} html
 */
function pseudoTranslate(html) {
    return html
        .split(/(<[^>]*>)/)
        .map((part) => {
            if (part.startsWith('<') || !/\p{L}/u.test(part)) return part;
            const [, lead, core, trail] = /** @type {RegExpExecArray} */ (/^(\s*)([\s\S]*?)(\s*)$/.exec(part));
            return `${lead}‹${core}›${trail}`;
        })
        .join('');
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} file
 */
async function openPage(page, testInfo, file) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({
        messageSecret: 'duckduckgo-android-messaging-secret',
        javascriptInterface: 'contentScopeScripts',
        messageCallback: 'messageCallback',
    });
    await collector.load(`${PAGES}/${file}`, CONFIG);
    return collector;
}

/**
 * Sends a message as native would and returns the params of the feature's reply.
 * @param {ResultsCollector} collector
 * @param {string} name
 * @param {Record<string, any>} params
 * @param {string} reply
 */
async function send(collector, name, params, reply) {
    const isReply = (/** @type {Record<string, any>} */ m) => m.payload.method === reply;
    const before = (await collector.outgoingMessages()).filter(isReply).length;
    await collector.simulateSubscriptionMessage('pageTranslation', name, params);
    const replies = await collector.waitForMessage(reply, before + 1);
    return replies[replies.length - 1].payload.params;
}

/** @param {ResultsCollector} collector @returns {Promise<Unit[]>} */
const extract = async (collector) => (await send(collector, 'extract', {}, 'extractResult')).units;
/** @param {ResultsCollector} collector @param {Update[]} updates @returns {Promise<number>} */
const apply = async (collector, updates) =>
    (await send(collector, 'apply', { sourceLanguage: 'en', targetLanguage: 'de', updates }, 'applyResult')).count;

/** @param {Unit[]} units @returns {Update[]} */
const translateAll = (units) =>
    units.map(({ id, text, html }) => (html ? { id, tree: htmlTree(pseudoTranslate(text)) } : { id, text: `‹${text}›` }));

/**
 * What native passes to apply for an HTML unit: TranslateKit's JSON tree of the translated HTML, built here with
 * jsdom in the same shape (`{text}` or `{tag, attrs, children}`).
 * @param {string} html
 * @returns {string}
 */
function htmlTree(html) {
    const template = new JSDOM('').window.document.createElement('template');
    template.innerHTML = html;
    /**
     * @param {NodeListOf<ChildNode>} nodes
     * @returns {any[]}
     */
    const convert = (nodes) => {
        /** @type {any[]} */
        const out = [];
        for (const node of nodes) {
            if (node.nodeType === 3) {
                out.push({ text: node.nodeValue });
            } else if (node.nodeType === 1) {
                const el = /** @type {Element} */ (node);
                const attrs = Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]));
                out.push({ tag: el.localName, attrs, children: convert(el.childNodes) });
            }
        }
        return out;
    };
    return JSON.stringify(convert(template.content.childNodes));
}

/**
 * Each unit's text as a reader sees it: HTML units parsed, whitespace collapsed.
 * @param {import('@playwright/test').Page} page
 * @param {Unit[]} units
 */
function plainTexts(page, units) {
    return page.evaluate(
        (list) => {
            const parser = new DOMParser();
            return list.map(({ text, html }) =>
                ((html ? parser.parseFromString(text, 'text/html').body.textContent : text) || '').replace(/\s+/g, ' ').trim(),
            );
        },
        units.map(({ text, html }) => ({ text, html })),
    );
}

/**
 * Visible text with letters that isn't marked as translated, outside the `untranslated` regions.
 * @param {import('@playwright/test').Page} page
 * @param {string[]} untranslated
 */
function textLeftUntranslated(page, untranslated) {
    return page.evaluate((skip) => {
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const el = node.parentElement;
            const text = node.nodeValue || '';
            if (!el || !/\p{L}/u.test(text) || text.includes('‹')) continue;
            if (el.closest('script, style, noscript, template')) continue;
            if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
            if (skip.length && el.closest(skip.join(','))) continue;
            out.push(text.trim());
        }
        return out;
    }, untranslated);
}

/**
 * Text inside the `untranslated` regions that was translated anyway.
 * @param {import('@playwright/test').Page} page
 * @param {string[]} untranslated
 */
function textTranslatedAnyway(page, untranslated) {
    if (!untranslated.length) return Promise.resolve([]);
    return page.evaluate(
        (skip) => [...document.querySelectorAll(skip.join(','))].map((el) => el.textContent || '').filter((t) => t.includes('‹')),
        untranslated,
    );
}

/**
 * Every element's tag and attributes, in document order: the page's markup without its text.
 * @param {import('@playwright/test').Page} page
 */
function markup(page) {
    const TRANSLATED_ATTRIBUTES = [
        'title',
        'alt',
        'aria-label',
        'aria-description',
        'aria-roledescription',
        'aria-valuetext',
        'label',
        'abbr',
    ];
    return page.evaluate(
        (TRANSLATED_ATTRIBUTES) =>
            [...document.body.querySelectorAll('*')].map((el) =>
                [
                    el.tagName,
                    // The one allowed addition: an option's value is pinned before its text is translated.
                    ...[...el.attributes]
                        .filter((a) => !(el.tagName === 'OPTION' && a.name === 'value'))
                        // Translated attributes keep their name; only their value changes.
                        .map((a) => (TRANSLATED_ATTRIBUTES.includes(a.name) ? a.name : `${a.name}=${a.value}`)),
                ].join(' '),
            ),
        TRANSLATED_ATTRIBUTES,
    );
}

/** @param {import('@playwright/test').Page} page */
const bodyHTML = (page) => page.evaluate(() => document.body.innerHTML);

test.describe('pageTranslation', () => {
    for (const fixture of FIXTURES) {
        const untranslated = fixture.untranslated ?? [];

        test.describe(fixture.page, () => {
            test('extracts the expected units', async ({ page }, testInfo) => {
                const collector = await openPage(page, testInfo, fixture.page);
                const units = await extract(collector);
                expect(await plainTexts(page, units)).toEqual(fixture.units);
            });

            test('apply translates all visible text and keeps the markup', async ({ page }, testInfo) => {
                const collector = await openPage(page, testInfo, fixture.page);
                const markupBefore = await markup(page);
                const units = await extract(collector);
                expect(await apply(collector, translateAll(units))).toBe(units.length - (fixture.skipped ?? 0));
                expect(await textLeftUntranslated(page, untranslated)).toEqual([]);
                expect(await textTranslatedAnyway(page, untranslated)).toEqual([]);
                expect(await markup(page)).toEqual(markupBefore);
            });

            test('apply keeps every original element in the page', async ({ page }, testInfo) => {
                const collector = await openPage(page, testInfo, fixture.page);
                await page.evaluate(() => {
                    /** @type {any} */ (window).elementsBefore = [...document.body.querySelectorAll('*')];
                });
                await apply(collector, translateAll(await extract(collector)));
                const lost = await page.evaluate(() =>
                    /** @type {Element[]} */ (/** @type {any} */ (window).elementsBefore)
                        .filter((el) => !el.isConnected)
                        .map((el) => el.outerHTML),
                );
                expect(lost).toEqual([]);
            });
        });
    }

    test('serializes inline elements with per-unit ids and no attributes', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'merge.html');
        const units = await extract(collector);
        expect(units.map(({ text, html }) => ({ text, html }))).toEqual([
            { text: 'The <b data-t="0">quick</b> brown <a data-t="1">fox</a> jumps.', html: true },
            { text: 'Plain heading', html: false },
        ]);
        expect(new Set(units.map((u) => u.id)).size).toBe(units.length);
    });

    test('extracts every paragraph of a large page', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'large.html');
        expect((await extract(collector)).length).toBe(2000);
    });

    test('wraps a unit that starts with an element in a div', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'drop-cap.html');
        const [first, second] = await extract(collector);
        expect(first.text).toBe('<div><span data-t="0">A</span>iwa is the first word, and the whole paragraph must stay one unit.</div>');
        expect(second.text).toBe('The second paragraph has no drop cap.');
    });

    test('wraps a table cell that starts with a link in a div, never a td', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'table.html');
        const units = await extract(collector);
        expect(units[2].text).toBe('<div><a data-t="0">Ada</a> wrote the first program.</div>');
    });

    test('sends form controls inside a unit as empty tags', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'form.html');
        const units = await extract(collector);
        expect(units[1].text).toBe('<div><label data-t="0">Email address</label> <input data-t="1"></div>');
        expect(units[4].text).toBe('<div><button data-t="0">Sign in</button></div>');
    });

    test('apply skips units in another language, compared with the source language, not the page attribute', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'lang.html');
        await page.evaluate(() => document.documentElement.removeAttribute('lang'));
        const units = await extract(collector);
        expect(await apply(collector, translateAll(units))).toBe(units.length - 2);
        expect(await page.textContent('blockquote')).toBe('Une citation en français.');
        expect(await page.textContent('p[lang="en-GB"]')).toBe('‹British colour.›');
    });

    test('keeps the same nodes after apply', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'merge.html');
        await page.evaluate(() => {
            /** @type {any} */ (window).linkBefore = document.getElementById('m-link');
        });
        await apply(collector, translateAll(await extract(collector)));
        expect(await page.evaluate(() => document.getElementById('m-link') === /** @type {any} */ (window).linkBefore)).toBe(true);
        expect(await page.textContent('#m')).toBe('‹The› ‹quick› ‹brown› ‹fox› ‹jumps.›');
    });

    test('sets the page lang to the target language on the first apply', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'article.html');
        const units = await extract(collector);
        expect(await page.getAttribute('html', 'lang')).toBe('en');
        await apply(collector, translateAll(units));
        expect(await page.getAttribute('html', 'lang')).toBe('de');
    });

    test('skips a unit removed from the page since extract', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'article.html');
        const units = await extract(collector);
        await page.evaluate(() => document.querySelector('h1')?.remove());
        expect(await apply(collector, translateAll(units))).toBe(units.length - 1);
    });

    test('ignores unknown ids', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'article.html');
        const [first] = await extract(collector);
        expect(
            await apply(collector, [
                { id: 99999, text: 'x' },
                { id: first.id, text: '‹x›' },
            ]),
        ).toBe(1);
    });

    /** @type {[string, string, (page: import('@playwright/test').Page) => Promise<void>][]} */
    const messyOutputs = [
        [
            'reorders and keeps nodes',
            '<a data-t="1">renard</a> <b data-t="0">rapide</b> saute.',
            async (page) => {
                expect(await page.evaluate(() => document.getElementById('m-link') === /** @type {any} */ (window).linkBefore)).toBe(true);
                expect(await page.evaluate(() => document.querySelector('#m')?.firstElementChild?.tagName)).toBe('A');
            },
        ],
        [
            'clones a duplicated tag',
            'Le <b data-t="0">vite</b> et <b data-t="0">rapide</b> <a data-t="1">renard</a>.',
            async (page) => {
                expect(await page.locator('#m b').count()).toBe(2);
                expect(await page.locator('#m b').allTextContents()).toEqual(['vite', 'rapide']);
            },
        ],
        [
            // The engine empties a tag when it moves the text elsewhere; putting the original back would double it.
            'leaves a tag returned empty, empty',
            'Le <b data-t="0"></b> <a data-t="1">renard</a> saute.',
            async (page) => {
                expect(await page.textContent('#m b')).toBe('');
            },
        ],
        [
            'puts back an element missing from the output',
            'Le renard rapide saute.',
            async (page) => {
                expect(
                    await page.evaluate(() => {
                        const before = /** @type {any} */ (window).linkBefore;
                        return document.getElementById('m-link') === before && document.getElementById('m')?.contains(before);
                    }),
                ).toBe(true);
                expect(await page.locator('#m b').count()).toBe(1);
            },
        ],
        [
            'never creates an element for an unknown id',
            'Le <i data-t="7">nouveau</i> <b data-t="0">x</b> <a data-t="1">y</a>',
            async (page) => {
                expect(await page.locator('#m i').count()).toBe(0);
                expect(await page.textContent('#m')).toContain('nouveau');
            },
        ],
    ];

    for (const [name, output, check] of messyOutputs) {
        test(`merge ${name}`, async ({ page }, testInfo) => {
            const collector = await openPage(page, testInfo, 'merge.html');
            await page.evaluate(() => {
                /** @type {any} */ (window).linkBefore = document.getElementById('m-link');
            });
            const [unit] = await extract(collector);
            expect(await apply(collector, [{ id: unit.id, tree: htmlTree(output) }])).toBe(1);
            await check(page);
        });
    }

    test('leaves a unit untouched when the output does not parse', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'merge.html');
        const before = await page.innerHTML('#m');
        const [unit] = await extract(collector);
        // A tag without our id isn't something we sent; TranslateKit's "null" means its HTML was malformed.
        expect(await apply(collector, [{ id: unit.id, tree: htmlTree('Le <b>x</b> <a data-t="1">y</a>') }])).toBe(0);
        expect(await apply(collector, [{ id: unit.id, tree: 'null' }])).toBe(0);
        expect(await apply(collector, [{ id: unit.id, text: 'Le renard' }])).toBe(0);
        expect(await page.innerHTML('#m')).toBe(before);
    });

    test('leaves a wrapped unit untouched when the div does not come back', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'drop-cap.html');
        const [unit] = await extract(collector);
        expect(await apply(collector, [{ id: unit.id, tree: htmlTree('<span data-t="0">U</span>n mot') }])).toBe(0);
    });

    test('a second extract reads the page as it is', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'article.html');
        await apply(collector, translateAll(await extract(collector)));
        const translated = await bodyHTML(page);
        const units = await extract(collector);
        expect(await bodyHTML(page)).toBe(translated);
        expect(units.length).toBeGreaterThan(0);
        expect(units.every((u) => u.text.includes('‹'))).toBe(true);
    });

    test('survives a translation that turns the nesting inside out', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'nested.html');
        await page.evaluate(() => {
            /** @type {any} */ (window).linkBefore = document.getElementById('n-a');
        });
        const [unit] = await extract(collector);
        expect(
            await apply(collector, [{ id: unit.id, tree: htmlTree('<div><em data-t="2"><a data-t="0">Lisez</a></em> ici.</div>') }]),
        ).toBe(1);
        expect(await page.evaluate(() => document.getElementById('n')?.contains(/** @type {any} */ (window).linkBefore))).toBe(true);
        expect(await page.locator('#n em').count()).toBe(1);
        expect(await page.locator('#n span').count()).toBe(1);
    });

    test('never sends style or script contents and still applies the unit', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'style-child.html');
        const [unit] = await extract(collector);
        expect(unit.text).toBe('Hello <b data-t="0">there</b> friend.');
        expect(await apply(collector, translateAll([unit]))).toBe(1);
        expect(await page.evaluate(() => document.querySelector('#s')?.firstElementChild?.tagName)).toBe('STYLE');
    });

    test('replies to apply even when the languages are missing', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'lang.html');
        const [first] = await extract(collector);
        const { count } = await send(collector, 'apply', { sourceLanguage: null, updates: [{ id: first.id, text: '‹x›' }] }, 'applyResult');
        expect(count).toBe(1);
    });

    test('keeps the original of a duplicated tag in place, and only copies go into the copy', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'citation.html');
        const [unit] = await extract(collector);
        expect(unit.text).toBe(
            'Joy is a feeling<sup data-t="0"><a data-t="1"><span data-t="2">[</span>9<span data-t="3">]</span></a></sup> of happiness.',
        );
        // Bergamot's shape on Wikipedia: the citation comes back twice, the first time without its link.
        const output =
            'La alegría<sup data-t="0"></sup> es un sentimiento<sup data-t="0"><a data-t="1"><span data-t="2">[</span>9<span data-t="3">]</span></a></sup> de felicidad.';
        expect(await apply(collector, [{ id: unit.id, tree: htmlTree(output) }])).toBe(1);
        expect(await page.evaluate(() => document.getElementById('w-sup')?.contains(document.getElementById('w-link')))).toBe(true);
    });

    test('a citation whose text moved to the next tag is not doubled', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'citation.html');
        const units = await extract(collector);
        const unit = units[1];
        expect(unit.text).toBe(
            'The study<sup data-t="0"><a data-t="1"><span data-t="2">[</span>1<span data-t="3">]</span></a></sup> was small.',
        );
        const output = 'El estudio<sup data-t="0"><a data-t="1"><span data-t="2"></span><span data-t="3">[1]</span></a></sup> fue pequeño.';
        expect(await apply(collector, [{ id: unit.id, tree: htmlTree(output) }])).toBe(1);
        expect(await page.textContent('#c sup')).toBe('[1]');
    });

    test('a drop cap whose letter the engine dropped is left empty, not doubled', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'drop-cap.html');
        const [unit] = await extract(collector);
        expect(
            await apply(collector, [{ id: unit.id, tree: htmlTree('<div><span data-t="0"></span>Aiwa es la primera palabra.</div>') }]),
        ).toBe(1);
        expect(await page.textContent('p')).toBe('Aiwa es la primera palabra.');
    });

    test('accepts invisible formatting characters the engine moved outside the wrapper', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'drop-cap.html');
        const [unit] = await extract(collector);
        expect(
            await apply(collector, [{ id: unit.id, tree: htmlTree('\u200E<div><span data-t="0">U</span>na palabra.</div>\u200F\n') }]),
        ).toBe(1);
        expect(await page.textContent('p')).toBe('\u200EUna palabra.\u200F');
    });

    test('translates HTML units on a page that enforces Trusted Types and allows no policy of ours', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'tt-refused.html');
        const units = await extract(collector);
        expect(units.map((u) => u.html)).toEqual([true, false]);
        expect(await apply(collector, translateAll(units))).toBe(2);
        expect(await page.textContent('#m')).toBe('‹The› ‹quick› ‹brown› ‹fox› ‹jumps.›');
        expect(await page.textContent('h2')).toBe('‹Plain heading›');
    });

    test('flags hidden units as off screen', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'hidden.html');
        const units = await extract(collector);
        const texts = await plainTexts(page, units);
        expect(texts.filter((_, i) => units[i].vp === 1)).toEqual([
            'Visible paragraph.',
            'Show more',
            'Read the hidden part later.',
            'Street',
        ]);
    });

    test('extracts attribute units after content units, never on form controls', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'attributes.html');
        const units = await extract(collector);
        const attributes = ['Page about birds.', 'A small bird', 'Read about birds', 'Pop.', 'First choice'];
        expect(units.filter((u) => attributes.includes(u.text)).map((u) => ({ text: u.text, html: u.html }))).toEqual(
            attributes.map((text) => ({ text, html: false })),
        );
        expect(units.findIndex((u) => u.text === 'Page about birds.')).toBeGreaterThan(units.findIndex((u) => u.text === 'Population'));
        const all = units.map((u) => u.text);
        for (const text of ['Your email', 'Close dialog', 'Press me', 'Attributes']) expect(all).not.toContain(text);
    });

    test('pins option values and keeps the selection', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'select.html');
        await page.selectOption('#size', 'l');
        const units = await extract(collector);
        await apply(collector, translateAll(units));
        expect(
            await page.evaluate(() =>
                [...document.querySelectorAll('#size option')].map((o) => /** @type {HTMLOptionElement} */ (o).value),
            ),
        ).toEqual(['Small', 'Medium', 'l']);
        expect(await page.inputValue('#size')).toBe('l');
        expect(await page.textContent('#size option:nth-child(1)')).toBe('‹Small›');
    });

    test('sends a select inside a sentence as an empty tag', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'select.html');
        const [label] = await extract(collector);
        expect(label.text).toBe('<div><label data-t="0">Size <select data-t="1"></select></label></div>');
    });

    test('translates attributes but not on form controls', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'attributes.html');
        await apply(collector, translateAll(await extract(collector)));
        expect(await page.getAttribute('img', 'alt')).toBe('‹A small bird›');
        expect(await page.getAttribute('meta[name=description]', 'content')).toBe('‹Page about birds.›');
        expect(await page.getAttribute('input:not([type])', 'placeholder')).toBe('Your email');
        expect(await page.getAttribute('button', 'aria-label')).toBe('Close dialog');
    });

    test('translates hidden content', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'hidden.html');
        await apply(collector, translateAll(await extract(collector)));
        expect(await page.textContent('details p')).toBe('‹Collapsed answer.›');
        expect(await page.textContent('nav li')).toBe('‹Hidden menu item›');
    });

    // Known gap: adjacent text nodes are merged into one, so the page's data-driven node ("150") is removed and its
    // later updates don't show. Fixing it means sending each adjacent text node as its own placeholder tag.
    test.fail('keeps a React-style page working when it re-renders after translation', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'react.html');
        await apply(collector, translateAll(await extract(collector)));
        await page.click('#bump');
        expect(await page.evaluate(() => /** @type {any} */ (window).errors)).toEqual([]);
        expect(await page.textContent('#s1')).toContain('151');
    });

    /** @type {[string, string][]} */
    const reactShapes = [
        ['reordered', '<div><span data-t="1">paga ahora</span> <span data-t="0">has acumulado 150 naves</span></div>'],
        ['duplicated', '<div><span data-t="0">has acumulado</span> <span data-t="1">paga</span> <span data-t="0">150 naves</span></div>'],
        ['emptied', '<div><span data-t="0"></span> <span data-t="1">has acumulado 150 naves, paga ahora</span></div>'],
        ['dropped', '<div>has acumulado 150 naves <span data-t="1">paga ahora</span></div>'],
    ];
    for (const [shape, output] of reactShapes) {
        test(`React-style page re-renders after ${shape} engine output`, async ({ page }, testInfo) => {
            const collector = await openPage(page, testInfo, 'react.html');
            const [unit] = await extract(collector);
            expect(unit.text).toBe(
                '<div><span data-t="0">hey you this has accrued 150 spaceships</span> <span data-t="1">pay now</span></div>',
            );
            expect(await apply(collector, [{ id: unit.id, text: output }])).toBe(1);
            await page.click('#bump');
            const errors = await page.evaluate(() => /** @type {any} */ (window).errors);
            const shows151 = (await page.textContent('#msg'))?.includes('151');
            testInfo.annotations.push({ type: 'react', description: `${shape}: errors=${JSON.stringify(errors)} shows151=${shows151}` });
            expect(errors).toEqual([]);
        });
    }

    test("checks attributes without walking every element's ancestors", async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'deep.html');
        const elements = await page.evaluate(() => {
            const original = Element.prototype.matches;
            /** @type {any} */ (window).matchesCalls = 0;
            /** @type {any} */ (Element.prototype).matches = function (/** @type {string} */ selector) {
                /** @type {any} */ (window).matchesCalls++;
                return original.call(this, selector);
            };
            return document.body.querySelectorAll('*').length;
        });
        expect((await extract(collector)).length).toBe(100);
        const calls = await page.evaluate(() => /** @type {any} */ (window).matchesCalls);
        // About 2 per element (the walk itself); checking ancestors for every element was 26.
        expect(calls).toBeLessThan(elements * 3);
    });

    test('treats a datalist like a select: empty in its sentence, options pinned', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'datalist.html');
        const units = await extract(collector);
        expect(units[0].text).toBe('Color <input data-t="0"><datalist data-t="1"></datalist>');
        await apply(collector, translateAll(units));
        expect(
            await page.evaluate(() =>
                [...document.querySelectorAll('#colors option')].map((o) => /** @type {HTMLOptionElement} */ (o).value),
            ),
        ).toEqual(['Red', 'b']);
    });

    test('marks only units on screen as in the viewport', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'article.html');
        const units = await extract(collector);
        const texts = await plainTexts(page, units);
        const offScreen = texts.filter((_, i) => units[i].vp === 0);
        expect(texts.length).toBeGreaterThan(0);
        expect(offScreen).toEqual(['This paragraph is below the fold.']);
    });

    test('keeps listeners on links inside a unit', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'article.html');
        await apply(collector, translateAll(await extract(collector)));
        expect(await page.textContent('#data-link')).toBe('‹full data set›');
        await page.click('#data-link');
        expect(await page.evaluate(() => /** @type {any} */ (window).linkClicks)).toBe(1);
    });

    test('keeps form controls, their typed values and listeners', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'form.html');
        await page.fill('#email', 'me@example.com');
        await page.evaluate(() => {
            /** @type {any} */ (window).emailBefore = document.getElementById('email');
        });
        const units = await extract(collector);
        expect(units.length).toBeGreaterThan(0);
        await apply(collector, translateAll(units));
        expect(await page.evaluate(() => document.getElementById('email') === /** @type {any} */ (window).emailBefore)).toBe(true);
        expect(await page.inputValue('#email')).toBe('me@example.com');
        expect(await page.textContent('label')).toBe('‹Email address›');
        await page.click('#submit');
        expect(await page.evaluate(() => /** @type {any} */ (window).submitClicks)).toBe(1);
    });

    test('does not run markup the engine returns', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'html-like-text.html');
        const units = await extract(collector);
        expect(units.length).toBe(1);
        // An engine that unescapes the text it was given: a plain-text unit is written as text.
        const markup = '<p>Posted comment: <img src=x onerror="window.injected = true"></p>';
        expect(await apply(collector, [{ id: units[0].id, text: markup }])).toBe(1);
        await page.waitForTimeout(200);
        expect(await page.evaluate(() => /** @type {any} */ (window).injected)).toBeUndefined();
        expect(await page.textContent('p')).toBe(markup);
    });

    test('escapes the text of an HTML unit, leaving / as it is', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'escaping.html');
        const [unit] = await extract(collector);
        expect(unit.text).toBe(`R&amp;D and/or &lt;b&gt; &quot;quoted&quot; &apos;too&apos; <b data-t="0">bold</b>`);
        const before = await page.textContent('p');
        expect(await apply(collector, [{ id: unit.id, tree: htmlTree(unit.text) }])).toBe(1);
        expect(await page.textContent('p')).toBe(before);
    });

    test('rejects an HTML unit whose output carries markup we did not send', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'merge.html');
        const [unit, heading] = await extract(collector);
        const injected = 'Le <img src=x onerror="window.injected = true"> <b data-t="0">x</b> <a data-t="1">y</a>';
        const count = await apply(collector, [
            { id: unit.id, tree: htmlTree(injected) },
            { id: heading.id, text: '‹Plain heading›' },
        ]);
        await page.waitForTimeout(200);
        expect(count).toBe(1);
        expect(await page.evaluate(() => /** @type {any} */ (window).injected)).toBeUndefined();
        expect(await page.locator('#m img').count()).toBe(0);
    });
});
