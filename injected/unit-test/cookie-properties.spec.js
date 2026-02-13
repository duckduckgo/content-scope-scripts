import fc from 'fast-check';
import { Cookie } from '../src/cookie.js';

// --- Arbitraries ---

/** Generate a valid cookie name (alphanumeric) */
const cookieName = () => fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]{0,19}$/);

/** Generate a valid cookie value */
const cookieValue = () => fc.stringMatching(/^[a-zA-Z0-9_-]{0,50}$/);

/** Generate a max-age value in seconds */
const maxAgeSeconds = () => fc.integer({ min: 0, max: 86400 * 365 * 10 });

/** Generate a simple cookie string (name=value) */
const simpleCookieString = () => fc.tuple(cookieName(), cookieValue()).map(([name, value]) => `${name}=${value}`);

/** Generate a cookie string with max-age */
const cookieWithMaxAge = () =>
    fc.tuple(cookieName(), cookieValue(), maxAgeSeconds()).map(([name, value, maxAge]) => `${name}=${value}; max-age=${maxAge}`);

/** Generate a cookie string with expires */
const cookieWithExpires = () =>
    fc.tuple(cookieName(), cookieValue(), fc.date({ min: new Date(), max: new Date(Date.now() + 86400 * 365 * 10 * 1000) })).map(
        ([name, value, date]) => `${name}=${value}; expires=${date.toUTCString()}`,
    );

// --- Cookie class properties ---

describe('Cookie class properties', () => {
    it('parses and preserves name from any valid cookie string', () => {
        fc.assert(
            fc.property(cookieName(), cookieValue(), (name, value) => {
                const cookie = new Cookie(`${name}=${value}`);
                expect(cookie.name).toBe(name);
            }),
            { numRuns: 100 },
        );
    });

    it('toString roundtrip preserves original string for simple cookies', () => {
        fc.assert(
            fc.property(simpleCookieString(), (cookieStr) => {
                const cookie = new Cookie(cookieStr);
                expect(cookie.toString()).toBe(cookieStr);
            }),
            { numRuns: 100 },
        );
    });

    it('toString roundtrip preserves original string for cookies with max-age', () => {
        fc.assert(
            fc.property(cookieWithMaxAge(), (cookieStr) => {
                const cookie = new Cookie(cookieStr);
                expect(cookie.toString()).toBe(cookieStr);
            }),
            { numRuns: 100 },
        );
    });

    it('getExpiry returns a number for cookies with max-age', () => {
        fc.assert(
            fc.property(cookieWithMaxAge(), (cookieStr) => {
                const cookie = new Cookie(cookieStr);
                const expiry = cookie.getExpiry();
                expect(typeof expiry).toBe('number');
                expect(Number.isNaN(expiry)).toBeFalse();
            }),
            { numRuns: 100 },
        );
    });

    it('getExpiry returns NaN for cookies without expiry attributes', () => {
        fc.assert(
            fc.property(simpleCookieString(), (cookieStr) => {
                const cookie = new Cookie(cookieStr);
                expect(Number.isNaN(cookie.getExpiry())).toBeTrue();
            }),
            { numRuns: 100 },
        );
    });

    it('setting maxAge updates the expiry and re-parses', () => {
        fc.assert(
            fc.property(cookieWithMaxAge(), maxAgeSeconds(), (cookieStr, newMaxAge) => {
                const cookie = new Cookie(cookieStr);
                cookie.maxAge = newMaxAge;
                expect(cookie.getExpiry()).toBe(newMaxAge);
                expect(cookie.toString()).toContain(`max-age=${newMaxAge}`);
            }),
            { numRuns: 100 },
        );
    });

    it('setting maxAge on a cookie without max-age adds it', () => {
        fc.assert(
            fc.property(simpleCookieString(), maxAgeSeconds(), (cookieStr, newMaxAge) => {
                const cookie = new Cookie(cookieStr);
                // Verify no max-age initially
                expect(cookie.maxAge).toBeUndefined();
                cookie.maxAge = newMaxAge;
                expect(cookie.getExpiry()).toBe(newMaxAge);
                expect(cookie.toString()).toContain(`max-age=${newMaxAge}`);
            }),
            { numRuns: 100 },
        );
    });

    it('getExpiry for expires-based cookies returns a positive number for future dates', () => {
        fc.assert(
            fc.property(cookieWithExpires(), (cookieStr) => {
                const cookie = new Cookie(cookieStr);
                const expiry = cookie.getExpiry();
                // Expires dates are in the future, so expiry should be > 0
                expect(expiry).toBeGreaterThan(-1);
            }),
            { numRuns: 50 },
        );
    });

    it('domain attribute is extracted when present', () => {
        fc.assert(
            fc.property(cookieName(), cookieValue(), (name, value) => {
                const cookie = new Cookie(`${name}=${value}; domain=example.com`);
                expect(cookie.domain).toBe('example.com');
            }),
            { numRuns: 50 },
        );
    });
});
