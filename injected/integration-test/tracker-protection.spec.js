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
    expect(observed[0].payload.params.potentiallyBlocked).toBe(true);

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
    expect(observed[0].payload.params.potentiallyBlocked).toBe(true);

    await page.waitForTimeout(200);
    const allMessages = await collector.outgoingMessages();
    const injected = trackerMessages(allMessages).filter((m) => m.payload.method === 'surrogateInjected');
    expect(injected).toHaveLength(0);
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
    expect(observation.potentiallyBlocked).toBe(true);
});
