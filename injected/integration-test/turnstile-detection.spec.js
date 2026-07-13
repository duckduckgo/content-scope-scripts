import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/web-detection/pages/turnstile-challenge.html';
const WIDGETS_HTML = '/web-detection/pages/captcha-widgets.html';

/**
 * Build a config enabling the production `captcha` detectors (real selectors) with an
 * auto trigger, parameterised by visibility mode so we can compare the forced-layout
 * `visible` path against the layout-free `content` path against the same fixture.
 *
 * @param {'visible' | 'content' | 'any'} visibility
 */
function captchaConfig(visibility) {
    const autoTrigger = { auto: { state: 'enabled', when: { intervalMs: [50] } } };
    const element = (selector) => ({
        match: { element: { selector, visibility } },
        triggers: autoTrigger,
    });
    return {
        readme: 'Captcha detector regression config',
        version: 1,
        unprotectedTemporary: [],
        features: {
            breakageReporting: { state: 'enabled', hash: 'test', exceptions: [] },
            webDetection: {
                state: 'enabled',
                hash: 'test',
                exceptions: [],
                settings: {
                    detectors: {
                        captcha: {
                            recaptcha: element(['.g-recaptcha', "iframe[src*='recaptcha']", "iframe[title*='recaptcha' i]"]),
                            hcaptcha: element(['.h-captcha', "iframe[src*='hcaptcha.com']", "iframe[title*='hcaptcha' i]"]),
                            turnstile: element(['.cf-turnstile:not(#turnstile-wrapper)', '.cf-turnstile:not(#turnstile-wrapper) iframe']),
                            cloudflare: element(['#challenge-form', '#cf-wrapper', '.cf-browser-verification', '#challenge-running', '#cf-challenge-running', '#challenge-stage']),
                        },
                    },
                },
            },
        },
    };
}

/**
 * Instrumentation installed before the feature runs (in every frame). Counts calls to
 * the two layout-forcing APIs the detector can hit, tags calls against challenge
 * elements, and records the document.readyState at the first such call (to catch
 * work done before the page is loaded).
 */
function forcedLayoutProbe() {
     
    const CHALLENGE = '.cf-turnstile, .cf-turnstile iframe, #challenge-stage, #cf-wrapper, .cf-browser-verification, #challenge-running, #cf-challenge-running, #challenge-form, .g-recaptcha, .h-captcha';
    const w = /** @type {any} */ (window);
    w.__fl = { total: 0, challenge: 0, gbcr: 0, gcs: 0, firstReadyState: null, frame: window.top === window ? 'top' : 'sub' };
    const note = (el) => {
        if (w.__fl.firstReadyState === null) w.__fl.firstReadyState = document.readyState;
        try {
            if (el && el.nodeType === 1 && el.matches && el.matches(CHALLENGE)) w.__fl.challenge++;
        } catch {
            /* ignore */
        }
    };
    const rawGBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
        w.__fl.total++;
        w.__fl.gbcr++;
        note(this);
        return rawGBCR.apply(this, arguments);
    };
    const rawGCS = window.getComputedStyle;
     
    window.getComputedStyle = function (el) {
        w.__fl.total++;
        w.__fl.gcs++;
        note(el);
        return rawGCS.apply(this, arguments);
    };
}

/**
 * Read the forced-layout counters from every frame.
 * @param {import('@playwright/test').Page} page
 */
async function readForcedLayout(page) {
    const perFrame = [];
    for (const frame of page.frames()) {
        try {
            const fl = await frame.evaluate(() => /** @type {any} */ (window).__fl);
            if (fl) perFrame.push(fl);
        } catch {
            /* frame may be cross-origin / detached */
        }
    }
    const sum = (k) => perFrame.reduce((a, f) => a + (f[k] || 0), 0);
    return {
        perFrame,
        totalChallenge: sum('challenge'),
        topChallenge: perFrame.filter((f) => f.frame === 'top').reduce((a, f) => a + f.challenge, 0),
        subChallenge: perFrame.filter((f) => f.frame === 'sub').reduce((a, f) => a + f.challenge, 0),
    };
}

/**
 * Load a fixture with the given visibility mode and return coverage + forced-layout stats.
 * @param {import('@playwright/test').Page} page
 * @param {any} projectUse
 * @param {'visible' | 'content' | 'any'} visibility
 * @param {string} [html]
 */
async function run(page, projectUse, visibility, html = HTML) {
    const collector = ResultsCollector.create(page, projectUse);
    collector.withMockResponse({ webDetectionAutoRun: null });
    await page.addInitScript(forcedLayoutProbe);
    await collector.load(html, captchaConfig(visibility));

    // Let the auto-run intervals (50ms) fire a few times across all frames.
    await page.waitForTimeout(400);

    const autoRuns = (await collector.outgoingMessages())
        .map((c) => /** @type {any} */ (c.payload))
        .filter((p) => p.method === 'webDetectionAutoRun')
        .map((p) => ({ id: p.params?.detectorId, detected: p.params?.detected }));

    const fl = await readForcedLayout(page);
    return { autoRuns, fl };
}

test.describe('Turnstile detector regression', () => {
    test('visible mode detects the challenge but forces synchronous layout on challenge elements', async ({ page }, testInfo) => {
        const { autoRuns, fl } = await run(page, testInfo.project.use, 'visible');

        // Coverage: the challenge is detected.
        const detected = autoRuns.filter((r) => r.detected === true).map((r) => r.id);
        expect(detected).toContain('captcha.cloudflare');

        // Mechanism (the suspected reload-loop trigger): the `visible` path reads
        // getComputedStyle()/getBoundingClientRect() on the challenge elements, forcing
        // synchronous layout. Contrast with the `content` test, which is 0.
        expect(fl.topChallenge).toBeGreaterThan(0);
         
        console.log('[visible] forcedLayout=', JSON.stringify(fl.perFrame), 'detected=', detected);
    });

    test('content mode detects the challenge with ZERO forced layout on challenge elements', async ({ page }, testInfo) => {
        const { autoRuns, fl } = await run(page, testInfo.project.use, 'content');

        // Coverage preserved: still detected via layout-free content check.
        const detected = autoRuns.filter((r) => r.detected === true).map((r) => r.id);
        expect(detected).toContain('captcha.cloudflare');

        // No forced layout on challenge elements in any frame.
        expect(fl.totalChallenge).toBe(0);
         
        console.log('[content] forcedLayout=', JSON.stringify(fl.perFrame), 'detected=', detected);
    });

    // The core regression guard: `content` must detect every captcha widget type that
    // `visible` does. If a future change breaks the layout-free check, this fails.
    const ALL = ['captcha.recaptcha', 'captcha.hcaptcha', 'captcha.turnstile', 'captcha.cloudflare'];

    test('visible mode detects all four captcha widget types (baseline)', async ({ page }, testInfo) => {
        const { autoRuns } = await run(page, testInfo.project.use, 'visible', WIDGETS_HTML);
        const detected = autoRuns.filter((r) => r.detected === true).map((r) => r.id);
        for (const id of ALL) expect(detected).toContain(id);
    });

    test('content mode detects all four captcha widget types with ZERO forced layout', async ({ page }, testInfo) => {
        const { autoRuns, fl } = await run(page, testInfo.project.use, 'content', WIDGETS_HTML);
        const detected = autoRuns.filter((r) => r.detected === true).map((r) => r.id);
        for (const id of ALL) expect(detected).toContain(id);
        expect(fl.totalChallenge).toBe(0);
         
        console.log('[content widgets] detected=', detected, 'forcedLayout=', JSON.stringify(fl.perFrame));
    });
});
