import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const PAGES = '/page-translation/pages';
const CONFIG = './integration-test/test-pages/page-translation/config/page-translation.json';

/**
 * @typedef {{ id: number, text: string, html: boolean, vp: 0 | 1 }} Unit
 * @typedef {{ id: number, text: string }} Update
 * @typedef {object} Fixture
 * @property {string} page
 * @property {string[]} units - each unit's plain text, in document order
 * @property {string[]} [untranslated] - selectors whose text must stay as it is
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
        page: 'lang.html',
        units: ['Untagged paragraph.', 'British colour.'],
        untranslated: ['[lang="fr"]', '[lang="FR-ca"]'],
    },
    {
        page: 'soft-hyphen.html',
        units: ['Die Bundesregierung tagt.'],
    },
    {
        // Options stay untranslated until their values are pinned.
        page: 'select.html',
        units: ['Size'],
        untranslated: ['select'],
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
const extract = async (collector) =>
    (await send(collector, 'extract', { sourceLanguage: 'en', targetLanguage: 'de' }, 'extractResult')).units;
/** @param {ResultsCollector} collector @param {Update[]} updates @returns {Promise<number>} */
const apply = async (collector, updates) => (await send(collector, 'apply', { updates }, 'applyResult')).count;
/** @param {ResultsCollector} collector @returns {Promise<number>} */
const revert = async (collector) => (await send(collector, 'revert', {}, 'revertResult')).count;

/** @param {Unit[]} units @returns {Update[]} */
const translateAll = (units) => units.map(({ id, text, html }) => ({ id, text: html ? pseudoTranslate(text) : `‹${text}›` }));

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
    return page.evaluate(() =>
        [...document.body.querySelectorAll('*')].map((el) =>
            [el.tagName, ...[...el.attributes].map((a) => `${a.name}=${a.value}`)].join(' '),
        ),
    );
}

/** @param {import('@playwright/test').Page} page */
const bodyHTML = (page) => page.evaluate(() => document.body.innerHTML);

test.describe('pageTranslation', () => {
    test('replies to extract, apply and revert', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'article.html');
        expect(Array.isArray(await extract(collector))).toBe(true);
        expect(typeof (await apply(collector, []))).toBe('number');
        expect(typeof (await revert(collector))).toBe('number');
    });

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
                expect(await apply(collector, translateAll(units))).toBe(units.length);
                expect(await textLeftUntranslated(page, untranslated)).toEqual([]);
                expect(await textTranslatedAnyway(page, untranslated)).toEqual([]);
                expect(await markup(page)).toEqual(markupBefore);
            });

            test('revert restores the original page', async ({ page }, testInfo) => {
                const collector = await openPage(page, testInfo, fixture.page);
                const original = await bodyHTML(page);
                await apply(collector, translateAll(await extract(collector)));
                expect(await bodyHTML(page)).not.toBe(original);
                await revert(collector);
                expect(await bodyHTML(page)).toBe(original);
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

    test('keeps a run beside a block as one unit with its inline tags', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'mixed-container.html');
        const [run] = await extract(collector);
        expect(run).toEqual(expect.objectContaining({ text: 'Intro text sits directly in the container.', html: false }));
    });

    test('sends form controls inside a unit as empty tags', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'form.html');
        const units = await extract(collector);
        expect(units[1].text).toBe('<div><label data-t="0">Email address</label> <input data-t="1"></div>');
        expect(units[4].text).toBe('<div><button data-t="0">Sign in</button></div>');
    });

    test('sends an excluded inline element as an empty tag without its text', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'opt-outs.html');
        const units = await extract(collector);
        expect(units[1].text).toBe('Use <code data-t="0"></code> to check your changes.');
    });

    test('compares lang with the source language, not the page attribute', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'lang.html');
        await page.evaluate(() => document.documentElement.removeAttribute('lang'));
        expect(await plainTexts(page, await extract(collector))).toEqual(['Untagged paragraph.', 'British colour.']);
    });

    test('strips soft hyphens from the text sent', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'soft-hyphen.html');
        const [unit] = await extract(collector);
        expect(unit.text).toBe('Die Bundesregierung tagt.');
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

    test('rejects an HTML unit whose output carries markup we did not send', async ({ page }, testInfo) => {
        const collector = await openPage(page, testInfo, 'merge.html');
        const [unit, heading] = await extract(collector);
        const injected = 'Le <img src=x onerror="window.injected = true"> <b data-t="0">x</b> <a data-t="1">y</a>';
        const count = await apply(collector, [
            { id: unit.id, text: injected },
            { id: heading.id, text: '‹Plain heading›' },
        ]);
        await page.waitForTimeout(200);
        expect(count).toBe(1);
        expect(await page.evaluate(() => /** @type {any} */ (window).injected)).toBeUndefined();
        expect(await page.locator('#m img').count()).toBe(0);
    });
});
