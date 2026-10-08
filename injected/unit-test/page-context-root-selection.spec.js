import { JSDOM } from 'jsdom';
import { selectLargestVisibleRoot } from '../src/features/page-context.js';

const SELECTOR = 'main, article, .content, .main, #content, #main';

// JSDOM has no layout, so `[hidden]` stands in for "not rendered" and text length skips hidden text,
// the way innerText does in a browser.
const isRendered = (el) => !el.closest('[hidden]');
const textLength = (el) => {
    let length = 0;
    const walker = el.ownerDocument.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentElement && isRendered(node.parentElement)) {
            length += node.textContent.replace(/\s+/g, ' ').trim().length;
        }
    }
    return length;
};

/**
 * @param {string} bodyHtml
 * @param {{ minCoverage?: number, maxCandidates?: number }} [options]
 * @returns {string | null} the `id` of the selected root, or null for "use the body"
 */
function select(bodyHtml, { minCoverage = 0.35, maxCandidates = 100 } = {}) {
    const { document } = new JSDOM(`<!DOCTYPE html><html><body>${bodyHtml}</body></html>`).window;
    const root = selectLargestVisibleRoot(document.querySelectorAll(SELECTOR), {
        bodyTextLength: textLength(document.body),
        minCoverage,
        maxCandidates,
        isRendered,
        textLength,
    });
    return root ? root.id : null;
}

const paragraphs = (count, label) =>
    Array.from(
        { length: count },
        (_, i) => `<p>${label} paragraph ${i + 1} explains the story in enough detail to be real content.</p>`,
    ).join('');

describe('page-context.js - selectLargestVisibleRoot', () => {
    it('picks the real article over an earlier teaser article', () => {
        const html = `
            <article id="teaser"><h2>Teaser for another story</h2><p>One line.</p></article>
            <article id="story"><h1>Story</h1>${paragraphs(6, 'Story')}</article>`;
        expect(select(html)).toBe('story');
    });

    it('skips a hidden drawer even when it holds the most text', () => {
        const html = `
            <header><div class="content" id="widget">Adjust appearance</div></header>
            <div hidden><div class="content" id="drawer">${paragraphs(20, 'Menu')}</div></div>
            <main id="main">${paragraphs(6, 'Story')}</main>`;
        expect(select(html)).toBe('main');
    });

    it('uses the body for a list of small cards', () => {
        const cards = Array.from(
            { length: 12 },
            (_, i) => `<article id="card-${i}"><h3>Gig ${i}</h3><p>From $${i + 10}</p></article>`,
        ).join('');
        expect(select(`<h1>Website design</h1>${cards}`)).toBe(null);
    });

    it('uses the body when main holds only part of the content', () => {
        const html = `
            <main id="main"><h1>Title</h1><p>Short intro.</p></main>
            <div class="article-body">${paragraphs(6, 'Body')}</div>`;
        expect(select(html)).toBe(null);
    });

    it('keeps main on a normal article page with nav and footer', () => {
        const html = `
            <header><nav><a href="/">Home</a> <a href="/news">News</a> <a href="/sport">Sport</a></nav></header>
            <main id="main"><article id="story"><h1>Story</h1>${paragraphs(6, 'Story')}</article></main>
            <footer><a href="/about">About</a> <a href="/privacy">Privacy</a></footer>`;
        expect(select(html)).toBe('main');
    });

    it('does not measure candidates nested in the current best', () => {
        const measured = [];
        const { document } = new JSDOM(`<main id="main"><article id="story"><div class="content">Text</div></article></main>`).window;
        selectLargestVisibleRoot(document.querySelectorAll(SELECTOR), {
            bodyTextLength: 4,
            minCoverage: 0.5,
            maxCandidates: 20,
            isRendered,
            textLength: (el) => {
                measured.push(el.id);
                return textLength(el);
            },
        });
        expect(measured).toEqual(['main']);
    });

    it('stops after maxCandidates', () => {
        const html = `
            <article id="first">${paragraphs(2, 'First')}</article>
            <article id="second">${paragraphs(6, 'Second')}</article>`;
        expect(select(html, { minCoverage: 0.1 })).toBe('second');
        expect(select(html, { minCoverage: 0.1, maxCandidates: 1 })).toBe('first');
    });

    it('returns null when no candidate has text', () => {
        expect(select('<p>Plain page</p>')).toBe(null);
        expect(select('<main id="main"></main><p>Plain page</p>')).toBe(null);
    });
});
