import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { extractNudgeSignals } from '../src/features/page-context.js';

const FIXTURES = new URL('../integration-test/test-pages/page-context/nudges/', import.meta.url);

/**
 * @param {string} html
 * @param {string} [url]
 */
function signalsFor(html, url = 'https://example.com/') {
    const dom = new JSDOM(html, { url });
    return extractNudgeSignals(dom.window.document);
}

/** @param {string} name */
function fixture(name) {
    return signalsFor(readFileSync(new URL(name, FIXTURES), 'utf8'), `http://localhost:3220/page-context/nudges/${name}`);
}

function scriptLd(obj) {
    return '<script type="application/ld+json">' + JSON.stringify(obj) + '</script>';
}

describe('page-context.js - extractNudgeSignals', () => {
    it('returns quiet signals for a bare page', () => {
        expect(signalsFor('<!DOCTYPE html><html><head></head><body></body></html>')).toEqual({
            wordCount: 0,
            readMinutes: 0,
            codeRatio: 0,
            codeBlockCount: 0,
            jsonLd: {},
            legalHint: null,
            sensitive: { password: false, payment: false, banking: false },
        });
    });

    it('counts words and estimates read time from the content root', () => {
        const dom = new JSDOM(`<body><nav>skip me</nav><article>${'word '.repeat(2300)}</article></body>`);
        const signals = extractNudgeSignals(dom.window.document, { contentRoot: dom.window.document.querySelector('article') });
        expect(signals.wordCount).toBe(2300);
        expect(signals.readMinutes).toBe(10);
    });

    it('counts two CJK characters as a word', () => {
        expect(signalsFor('<body>日本語の文章です</body>').wordCount).toBe(4);
    });

    it('measures how much of the page is code', () => {
        const signals = signalsFor('<body><p>intro</p><pre><code>const a = 1;\nconst b = 2;</code></pre><pre>x</pre></body>');
        expect(signals.codeBlockCount).toBe(2);
        expect(signals.codeRatio).toBeGreaterThan(0.5);
    });

    it('extracts the booking fixture reservation', () => {
        expect(fixture('booking.html').jsonLd).toEqual({
            reservation: {
                type: 'LodgingReservation',
                name: 'Hotel Alfama Lisboa',
                start: '2026-11-12T15:00:00+00:00',
                end: '2026-11-16T11:00:00+00:00',
                location: 'Hotel Alfama Lisboa, Rua de São Miguel 12, Lisbon, 1100-544, PT',
            },
        });
    });

    it('extracts the event fixture', () => {
        expect(fixture('event.html').jsonLd).toEqual({
            event: {
                name: 'Lunar Static – Afterglow Tour',
                startDate: '2026-12-04T19:00:00+00:00',
                endDate: '2026-12-04T23:00:00+00:00',
                location: 'O2 Academy Brixton, 211 Stockwell Road, London, SW9 9SL, GB',
            },
        });
    });

    it('extracts the recipe fixture from @graph', () => {
        expect(fixture('recipe.html').jsonLd).toEqual({
            recipe: { name: 'Creamy Chicken & Mushroom Pie', yield: '6 / 6 servings', ingredientCount: 13 },
        });
    });

    it('summarises a flight reservation', () => {
        const head = scriptLd({
            '@type': 'FlightReservation',
            reservationFor: {
                flightNumber: '1347',
                airline: { iataCode: 'TP' },
                departureAirport: { name: 'London Heathrow', iataCode: 'LHR' },
                arrivalAirport: { iataCode: 'LIS' },
                departureTime: '2026-11-12T09:35:00Z',
                arrivalTime: '2026-11-12T12:20:00Z',
            },
        });
        expect(signalsFor(head).jsonLd).toEqual({
            reservation: {
                type: 'FlightReservation',
                name: 'TP 1347 LHR → LIS',
                start: '2026-11-12T09:35:00Z',
                end: '2026-11-12T12:20:00Z',
                location: 'London Heathrow',
            },
        });
    });

    it('extracts product name, brand, price and rating', () => {
        const head = scriptLd({
            '@type': 'Product',
            name: 'Trail Runner 3',
            brand: { '@type': 'Brand', name: 'Acme' },
            offers: [{ '@type': 'Offer', price: 129.99, priceCurrency: 'USD' }],
            aggregateRating: { ratingValue: '4.4' },
        });
        expect(signalsFor(head).jsonLd).toEqual({
            product: { name: 'Trail Runner 3', brand: 'Acme', price: '129.99', currency: 'USD', rating: '4.4' },
        });
    });

    it('drops address parts repeated elsewhere in the location', () => {
        const head = scriptLd({
            '@type': 'MusicEvent',
            location: {
                name: 'Alexandra Palace',
                address: { streetAddress: 'Alexandra Palace Way, London N22 7AY', addressLocality: 'London', addressCountry: 'GB' },
            },
        });
        expect(signalsFor(head).jsonLd.event?.location).toBe('Alexandra Palace Way, London N22 7AY, GB');
    });

    it('ignores the publication marked as a Product in news paywall markup', () => {
        const head = scriptLd({
            '@type': 'NewsArticle',
            isPartOf: { '@type': ['CreativeWork', 'Product'], name: 'The Guardian' },
        });
        expect(signalsFor(head).jsonLd).toEqual({});
    });

    it('ignores password fields the page keeps hidden', () => {
        const dom = new JSDOM('<div id="modal"><input type="password"></div>', { url: 'https://example.com/' });
        const input = /** @type {any} */ (dom.window.document.querySelector('input'));
        input.checkVisibility = () => false;
        expect(extractNudgeSignals(dom.window.document).sensitive.password).toBe(false);
    });

    it('flags terms and privacy pages', () => {
        expect(signalsFor('<title>Privacy Policy</title>').legalHint).toBe('privacy');
        expect(signalsFor('<title>Help</title>', 'https://example.com/legal/terms-of-service').legalHint).toBe('tos');
        expect(signalsFor('<title>Blog</title><h1>Ten terminals</h1>').legalHint).toBe(null);
        expect(signalsFor('<title>Terms – Privacy & Terms</title>', 'https://example.com/terms').legalHint).toBe('tos');
    });

    it('flags login, payment and banking pages', () => {
        expect(signalsFor('<input type="password">').sensitive).toEqual({ password: true, payment: false, banking: false });
        expect(signalsFor('<input autocomplete="cc-number">').sensitive.payment).toBe(true);
        expect(signalsFor('', 'https://shop.example.com/checkout/').sensitive.payment).toBe(true);
        expect(signalsFor('', 'https://www.examplebank.com/').sensitive.banking).toBe(true);
        expect(signalsFor('<title>Online Banking</title>').sensitive.banking).toBe(true);
    });

    it('reads YouTube watch page details', () => {
        const html = `<head><title>Old - YouTube</title><meta itemprop="duration" content="PT4M13S"></head><body>
            <ytd-watch-flexy video-id="abc123"><ytd-watch-metadata><h1> How bridges work </h1>
            <ytd-channel-name><a>Engineering Explained</a></ytd-channel-name></ytd-watch-metadata></ytd-watch-flexy>
            </body>`;
        expect(signalsFor(html, 'https://www.youtube.com/watch?v=abc123').youtube).toEqual({
            videoId: 'abc123',
            title: 'How bridges work',
            channel: 'Engineering Explained',
            durationSec: 253,
        });
    });

    it('ignores stale YouTube meta tags after in-app navigation', () => {
        const html = `<head><title>New video - YouTube</title><meta itemprop="duration" content="PT4M13S"></head>
            <body><ytd-watch-flexy video-id="old"></ytd-watch-flexy></body>`;
        expect(signalsFor(html, 'https://www.youtube.com/watch?v=new').youtube).toEqual({
            videoId: 'new',
            title: 'New video',
            channel: null,
            durationSec: null,
        });
    });

    it('ignores meta tags that still describe the previous video', () => {
        const html = `<head><title>New video - YouTube</title><meta itemprop="identifier" content="old"><meta itemprop="duration" content="PT4M13S"></head>
            <body><ytd-watch-flexy video-id="new"></ytd-watch-flexy></body>`;
        expect(signalsFor(html, 'https://www.youtube.com/watch?v=new').youtube?.durationSec).toBe(null);
    });

    it('omits youtube off watch pages', () => {
        expect(signalsFor('', 'https://www.youtube.com/').youtube).toBeUndefined();
    });
});
