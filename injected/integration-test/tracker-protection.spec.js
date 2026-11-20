import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import {
    makeTrackerDataBasic,
    makeTrackerDataFacebook,
    makeTrackerDataGoogle,
    makeTrackerDataCtlActionPrefix,
} from './test-pages/tracker-protection/tracker-data-fixtures.js';

const HTML = '/tracker-protection/pages/tracker-protection.html';
const CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection.json';
const DISABLED_CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection-disabled.json';
const CTL_DISABLED_CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection-ctl-disabled.json';
const CTL_ENABLED_CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection-ctl-enabled.json';
const UNPROTECTED_CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection-unprotected.json';
const ALLOWLISTED_CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection-allowlisted.json';
const CTL_ACTION_PREFIX_DISABLED_CONFIG =
    './integration-test/test-pages/tracker-protection/config/tracker-protection-ctl-action-prefix-disabled.json';
const REAL_SURROGATES_CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection-real-surrogates.json';

function trackerMessages(messages) {
    return messages.filter((m) => m.payload.featureName === 'trackerProtection');
}

test('tracker-protection: detects tracker from dynamically added script', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/pixel.js');
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    const observation = messages[0].payload.params;

    expect(observation.url).toBe('https://tracker.example/pixel.js');
    expect(observation.resourceType).toBe('script');
    expect(observation.potentiallyBlocked).toBe(true);
});

test('tracker-protection: loads surrogate for matching rule', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/scripts/analytics.js');
    });

    const observed = await collector.waitForMessage('resourceObserved', 1);
    expect(observed[0].payload.params.url).toBe('https://tracker.example/scripts/analytics.js');
    expect(observed[0].payload.params.potentiallyBlocked).toBe(true);

    const injected = await collector.waitForMessage('surrogateInjected', 1);
    expect(injected[0].payload.params.url).toBe('https://tracker.example/scripts/analytics.js');
    expect(typeof injected[0].payload.params.surrogateName).toBe('string');
});

test('tracker-protection: reports non-tracker third-party URL as resourceObserved', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://safe-site.example/scripts/app.js');
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    const observation = messages[0].payload.params;

    expect(observation.url).toBe('https://safe-site.example/scripts/app.js');
    expect(observation.potentiallyBlocked).toBe(false);
    expect(observation.resourceType).toBe('script');
});

test('tracker-protection: does not send messages when disabled', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, DISABLED_CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/pixel.js');
    });

    await page.waitForTimeout(200);

    const allMessages = await collector.outgoingMessages();
    const resourceObservations = trackerMessages(allMessages).filter((m) => m.payload.method === 'resourceObserved');
    expect(resourceObservations).toHaveLength(0);
});

test('tracker-protection: reports allowed tracker with potentiallyBlocked=false', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://allowed.example/something.js');
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    const observation = messages[0].payload.params;

    expect(observation.url).toBe('https://allowed.example/something.js');
    expect(observation.potentiallyBlocked).toBe(false);
});

test('tracker-protection: detects tracker from XHR error', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://tracker.example/pixel.gif');
        xhr.send();
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    expect(messages[0].payload.params.url).toBe('https://tracker.example/pixel.gif');
    expect(messages[0].payload.params.potentiallyBlocked).toBe(true);
});

test('tracker-protection: detects tracker from fetch with URL object', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(async () => {
        await fetch(new URL('https://tracker.example/pixel.js')).catch(() => {});
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    const observation = messages[0].payload.params;
    expect(observation.url).toBe('https://tracker.example/pixel.js');
    expect(observation.resourceType).toBe('fetch');
    expect(observation.potentiallyBlocked).toBe(false);
});

test('tracker-protection: detects tracker from fetch with Request object', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(async () => {
        await fetch(new Request('https://tracker.example/beacon.js')).catch(() => {});
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    const observation = messages[0].payload.params;
    expect(observation.url).toBe('https://tracker.example/beacon.js');
    expect(observation.resourceType).toBe('fetch');
    expect(observation.potentiallyBlocked).toBe(false);
});

test('tracker-protection: detects tracker from Image src assignment', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        const img = new Image();
        img.src = 'https://tracker.example/pixel.gif';
        img.dispatchEvent(new Event('error'));
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    const observation = messages[0].payload.params;
    expect(observation.url).toBe('https://tracker.example/pixel.gif');
    expect(observation.potentiallyBlocked).toBe(true);
});

test('tracker-protection: respects CTL disabled for fb-sdk', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataFacebook() });
    await collector.load(HTML, CTL_DISABLED_CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://facebook.example/sdk.js');
    });

    const observed = await collector.waitForMessage('resourceObserved', 1);
    expect(observed[0].payload.params.potentiallyBlocked).toBe(false);

    await page.waitForTimeout(200);
    const allMessages = await collector.outgoingMessages();
    const injected = trackerMessages(allMessages).filter((m) => m.payload.method === 'surrogateInjected');
    expect(injected).toHaveLength(0);
});

test('tracker-protection: CTL enabled injects fb-sdk surrogate', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataFacebook() });
    await collector.load(HTML, CTL_ENABLED_CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://facebook.example/sdk.js');
    });

    const observed = await collector.waitForMessage('resourceObserved', 1);
    expect(observed[0].payload.params.potentiallyBlocked).toBe(true);

    const injected = await collector.waitForMessage('surrogateInjected', 1);
    expect(injected[0].payload.params.url).toBe('https://facebook.example/sdk.js');
});

test('tracker-protection: ignores data URIs and non-HTTP URLs', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerImage('data:image/png;base64,iVBORw0KGgo=');
        /** @type {any} */ (window).addTrackerScript('blob:https://example.com/abc');
    });

    await page.waitForTimeout(200);

    const allMessages = await collector.outgoingMessages();
    const resourceObservations = trackerMessages(allMessages).filter((m) => m.payload.method === 'resourceObserved');
    expect(resourceObservations).toHaveLength(0);
});

test('tracker-protection: re-executes surrogate for repeated script additions', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/scripts/analytics.js');
    });

    const first = await collector.waitForMessage('surrogateInjected', 1);
    expect(first).toHaveLength(1);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/scripts/analytics.js');
    });

    const all = await collector.waitForMessage('surrogateInjected', 2);
    expect(all).toHaveLength(2);
});

test('tracker-protection: skips surrogate when script has integrity attribute', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        const script = document.createElement('script');
        script.integrity = 'sha512-fakehash';
        script.crossOrigin = 'anonymous';
        script.src = 'https://tracker.example/scripts/analytics.js';
        document.body.appendChild(script);
    });

    const observed = await collector.waitForMessage('resourceObserved', 1);
    expect(observed[0].payload.params.potentiallyBlocked).toBe(true);

    await page.waitForTimeout(200);
    const allMessages = await collector.outgoingMessages();
    const injected = trackerMessages(allMessages).filter((m) => m.payload.method === 'surrogateInjected');
    expect(injected).toHaveLength(0);
});

test('tracker-protection: reports allowlisted tracker as resourceObserved', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, ALLOWLISTED_CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/pixel.js');
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    const observation = messages[0].payload.params;

    expect(observation.url).toBe('https://tracker.example/pixel.js');
    expect(observation.potentiallyBlocked).toBe(false);
});

test('tracker-protection: pageUrl matches top-frame URL for resource observation', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    const pageUrl = page.url();
    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/pixel.js');
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    expect(messages[0].payload.params.pageUrl).toBe(pageUrl);
});

test('tracker-protection: pageUrl matches top-frame URL for surrogate injection', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    const pageUrl = page.url();
    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/scripts/analytics.js');
    });

    const injected = await collector.waitForMessage('surrogateInjected', 1);
    expect(injected[0].payload.params.pageUrl).toBe(pageUrl);
});

test('tracker-protection: non-tracker third-party request includes pageUrl', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://safe-site.example/scripts/widget.js');
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    const observation = messages[0].payload.params;

    expect(observation.potentiallyBlocked).toBe(false);
    expect(observation.pageUrl).toBe(page.url());
    expect(observation.resourceType).toBe('script');
});

test('tracker-protection: reports but does not block on unprotected domain', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, UNPROTECTED_CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/pixel.js');
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    expect(messages[0].payload.params.potentiallyBlocked).toBe(false);
});

test('tracker-protection: CTL disabled suppresses non-fb block-ctl-* surrogate', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataCtlActionPrefix() });
    await collector.load(HTML, CTL_ACTION_PREFIX_DISABLED_CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/scripts/analytics.js');
    });

    const observed = await collector.waitForMessage('resourceObserved', 1);
    expect(observed[0].payload.params.potentiallyBlocked).toBe(false);

    await page.waitForTimeout(200);
    const allMessages = await collector.outgoingMessages();
    const injected = trackerMessages(allMessages).filter((m) => m.payload.method === 'surrogateInjected');
    expect(injected).toHaveLength(0);
});

test('tracker-protection: non-CTL rule remains potentiallyBlocked when CTL disabled', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CTL_ACTION_PREFIX_DISABLED_CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/scripts/analytics.js');
    });

    const observed = await collector.waitForMessage('resourceObserved', 1);
    expect(observed[0].payload.params.potentiallyBlocked).toBe(true);
});

const realSurrogateCases = [
    { url: 'https://google-analytics.com/analytics.js', globalCheck: "typeof window.ga === 'function'", label: 'analytics.js' },
    { url: 'https://www.googletagmanager.com/gtm.js', globalCheck: "typeof window.ga !== 'undefined'", label: 'gtm.js' },
    { url: 'https://www.googletagservices.com/tag/js/gpt.js', globalCheck: "typeof window.googletag === 'object'", label: 'gpt.js' },
];

for (const { url, globalCheck, label } of realSurrogateCases) {
    test(`tracker-protection: real surrogate ${label} blocks, injects, and defines global`, async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withUserPreferences({ trackerData: makeTrackerDataGoogle() });
        await collector.load(HTML, REAL_SURROGATES_CONFIG);

        await page.evaluate((src) => {
            /** @type {any} */ (window).addTrackerScript(src);
        }, url);

        const observed = await collector.waitForMessage('resourceObserved', 1);
        expect(observed[0].payload.params.potentiallyBlocked).toBe(true);

        const injected = await collector.waitForMessage('surrogateInjected', 1);
        expect(injected[0].payload.params.url).toBe(url);

        const globalDefined = await page.evaluate((check) => {
            return eval(check); // eslint-disable-line no-eval
        }, globalCheck);
        expect(globalDefined).toBe(true);
    });
}

test('tracker-protection: detects tracker from DOM-appended img element', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerImage('https://tracker.example/pixel.gif');
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    const observation = messages[0].payload.params;
    expect(observation.url).toBe('https://tracker.example/pixel.gif');
    expect(observation.potentiallyBlocked).toBe(false);
});

/**
 * Collects everything a page can observe about the APIs trackerProtection wraps: own-property placement,
 * descriptor flags, Function.prototype.toString output, name/length, and behaviour at the edges
 * (detached calls, invalid receivers, XHR async defaulting, img.src round-trip).
 * Run against a page with the feature disabled and one with it enabled, the results must be identical.
 * @param {import('@playwright/test').Page} page
 */
function snapshotWrappedApiSurface(page) {
    return page.evaluate(async () => {
        const fnToString = Function.prototype.toString;

        /** @param {PropertyDescriptor | undefined} d */
        const flags = (d) => (d ? { writable: d.writable, enumerable: d.enumerable, configurable: d.configurable } : null);

        // `ownToString` is what `fn.toString()` returns; `protoToString` is `Function.prototype.toString.call(fn)`.
        // The latter bypasses wrapToString's Proxy trap, so for wrapped functions V8 reports a generic, nameless
        // native string. It is captured separately so the test can assert it ends in [native code] without
        // requiring an exact match.
        /** @param {Function | undefined} fn */
        const fnInfo = (fn) =>
            typeof fn === 'function'
                ? { ownToString: fn.toString(), protoToString: fnToString.call(fn), name: fn.name, length: fn.length }
                : { type: typeof fn };

        /** @param {object} obj @param {string} prop */
        const method = (obj, prop) => {
            const d = Object.getOwnPropertyDescriptor(obj, prop);
            return { own: Object.prototype.hasOwnProperty.call(obj, prop), flags: flags(d), fn: fnInfo(d?.value) };
        };

        const srcDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');

        /** @param {() => any} fn */
        const outcome = async (fn) => {
            try {
                const r = await fn();
                return { ok: true, value: r };
            } catch (e) {
                return { ok: false, name: e?.name, message: e?.message };
            }
        };

        const detachedFetch = window.fetch;
        const img = new Image();
        img.src = 'https://example.com/round-trip.gif';

        return {
            fetch: method(window, 'fetch'),
            fetchOnWindowPrototype: Object.prototype.hasOwnProperty.call(Window.prototype, 'fetch'),
            xhrOpen: method(XMLHttpRequest.prototype, 'open'),
            xhrSend: method(XMLHttpRequest.prototype, 'send'),
            imageSrc: {
                own: Object.prototype.hasOwnProperty.call(HTMLImageElement.prototype, 'src'),
                imagePrototypeIsHTMLImageElement: Image.prototype === HTMLImageElement.prototype,
                enumerable: srcDesc?.enumerable,
                configurable: srcDesc?.configurable,
                hasValue: srcDesc ? 'value' in srcDesc : null,
                get: fnInfo(srcDesc?.get),
                set: fnInfo(srcDesc?.set),
            },
            behaviour: {
                detachedFetch: await outcome(async () => (await detachedFetch(location.href)).ok),
                fetchInvalidReceiver: await outcome(() => fetch.call({}, location.href)),
                xhrOpenTwoArgsIsAsync: await outcome(() => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', location.href);
                    // Setting responseType on a synchronous XHR throws InvalidAccessError in a window context.
                    xhr.responseType = 'json';
                    return xhr.responseType;
                }),
                xhrOpenSyncStaysSync: await outcome(() => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', location.href, false);
                    xhr.responseType = 'json';
                    return xhr.responseType;
                }),
                imgSrcRoundTrip: { property: img.src, attribute: img.getAttribute('src') },
            },
        };
    });
}

test('tracker-protection: wrapped fetch/XHR/img.src are indistinguishable from native', async ({ page }, testInfo) => {
    // Baseline: same page with trackerProtection disabled, so nothing is wrapped.
    const baselinePage = await page.context().newPage();
    const baselineCollector = ResultsCollector.create(baselinePage, testInfo.project.use);
    await baselineCollector.load(HTML, DISABLED_CONFIG);
    const native = await snapshotWrappedApiSurface(baselinePage);
    await baselinePage.close();

    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);
    const wrapped = await snapshotWrappedApiSurface(page);

    // Sanity-check the baseline itself, so the comparison below can't pass vacuously.
    const nativeCode = /\{\s*\[native code\]\s*\}$/;
    expect(native.fetch.own).toBe(true);
    expect(native.fetchOnWindowPrototype).toBe(false);
    for (const info of [native.fetch.fn, native.xhrOpen.fn, native.xhrSend.fn, native.imageSrc.get, native.imageSrc.set]) {
        expect(info.ownToString).toMatch(nativeCode);
        expect(info.protoToString).toMatch(nativeCode);
    }
    expect(native.imageSrc.enumerable).toBe(true);
    expect(native.imageSrc.configurable).toBe(true);
    expect(native.behaviour.detachedFetch).toEqual({ ok: true, value: true });
    expect(native.behaviour.fetchInvalidReceiver.ok).toBe(false);
    expect(native.behaviour.xhrOpenTwoArgsIsAsync).toEqual({ ok: true, value: 'json' });
    expect(native.behaviour.xhrOpenSyncStaysSync.ok).toBe(false);

    // Function.prototype.toString.call() on any wrapped function must still read as native code.
    for (const info of [wrapped.fetch.fn, wrapped.xhrOpen.fn, wrapped.xhrSend.fn, wrapped.imageSrc.get, wrapped.imageSrc.set]) {
        expect(info.protoToString).toMatch(nativeCode);
    }

    // Function.prototype.toString.call(proxy) omits the function name in V8 (a limitation of the Proxy-based
    // wrapToString shared by all features), so protoToString is excluded from the exact match below.
    /** @param {Awaited<ReturnType<typeof snapshotWrappedApiSurface>>} snap */
    const comparable = (snap) => {
        const copy = structuredClone(snap);
        for (const info of [copy.fetch.fn, copy.xhrOpen.fn, copy.xhrSend.fn, copy.imageSrc.get, copy.imageSrc.set]) {
            delete info.protoToString;
        }
        return copy;
    };

    // With trackerProtection on, every other observable detail must match native exactly.
    expect(comparable(wrapped)).toEqual(comparable(native));

    // And the wrappers must actually be installed: fetch reporting still flows through them.
    await page.evaluate(async () => {
        await fetch('https://tracker.example/native-check.js').catch(() => {});
    });
    const messages = await collector.waitForMessage('resourceObserved', 1);
    expect(messages.map((m) => m.payload.params.url)).toContain('https://tracker.example/native-check.js');
});

test('tracker-protection: XHR send error still reports after wrapping', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://tracker.example/xhr-native-check.gif');
        xhr.send();
    });

    const messages = await collector.waitForMessage('resourceObserved', 1);
    const observation = messages.find((m) => m.payload.params.url === 'https://tracker.example/xhr-native-check.gif');
    expect(observation?.payload.params.resourceType).toBe('xmlhttprequest');
    expect(observation?.payload.params.potentiallyBlocked).toBe(true);
});
