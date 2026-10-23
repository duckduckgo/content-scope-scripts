/**
 * Replaying a captured site as a fixture.
 *
 * `page-gen/capture-sites.mjs` saves each site as three files: `page.html`, the settled DOM
 * with every script made inert; `har.zip`, every subresource the page loaded; and
 * `meta.json`. Replay serves the first as the main document and the rest from the HAR, so
 * stylesheets, fonts and images load and layout is the real one, which a `visible`
 * condition needs. Nothing on the page executes, so the DOM is the one captured, on every
 * run and in every engine.
 *
 * Real site content lives only under the gitignored `.bench-variants/sites/`, never in git.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** How long replay waits for subresources before cancelling the rest. */
const LOAD_TIMEOUT_MS = 10000;

/** Where `capture-sites.mjs` writes captures by default, and where a bare site name resolves. */
export const SITES_ROOT = path.resolve(here, '..', '.bench-variants', 'sites');

/**
 * @typedef {object} SiteMeta
 * @property {string} name
 * @property {string} category
 * @property {string} url - The URL the capture was asked for
 * @property {string} finalUrl - Where it settled, after redirects. Replay serves the page here
 * @property {string} capturedAt
 * @property {string} userAgent
 * @property {{ width: number, height: number }} viewport
 */

/**
 * @param {string} site - A directory, or a name under `SITES_ROOT`
 * @returns {string}
 */
export function siteDir(site) {
    return path.isAbsolute(site) ? site : path.join(SITES_ROOT, site);
}

/**
 * @param {string} site
 * @returns {SiteMeta}
 */
export function readSiteMeta(site) {
    const dir = siteDir(site);
    const metaPath = path.join(dir, 'meta.json');
    if (!existsSync(metaPath)) {
        throw new Error(`No capture at ${dir}. Run \`node scripts/detector-bench/page-gen/capture-sites.mjs\` first.`);
    }
    return JSON.parse(readFileSync(metaPath, 'utf8'));
}

/**
 * Serve a captured site to `page`: the saved DOM for the main document at the capture's
 * final URL, every subresource from the HAR.
 *
 * Sub-frame documents are aborted: the auto trigger only runs in the top frame, and a
 * frame's own subresources are not in the HAR's scope for this page anyway. Scripts are
 * aborted as a backstop - the captured DOM has none that would load - so that a capture
 * that missed one cannot start executing on replay.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} site
 * @returns {Promise<SiteMeta>}
 */
export async function routeSite(page, site) {
    const dir = siteDir(site);
    const meta = readSiteMeta(site);
    const html = readFileSync(path.join(dir, 'page.html'), 'utf8');

    await page.routeFromHAR(path.join(dir, 'har.zip'), { notFound: 'abort' });
    // Registered after the HAR route, so it takes precedence: Playwright runs matching
    // routes in reverse order of registration.
    await page.route('**/*', async (route) => {
        const request = route.request();
        const type = request.resourceType();
        if (type === 'document') {
            if (request.frame() === page.mainFrame() && request.url() === meta.finalUrl) {
                await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
                return;
            }
            await route.abort();
            return;
        }
        if (type === 'script') {
            await route.abort();
            return;
        }
        await route.fallback();
    });
    return meta;
}

/**
 * Open a captured site in a fresh page of `browser`.
 *
 * `bypassCSP` because the harness is injected with `addScriptTag`, which a captured page's
 * own policy would otherwise block; it has no other effect, since nothing on the page runs.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {string} site
 * @returns {Promise<import('@playwright/test').Page>}
 */
export async function openSite(browser, site) {
    const meta = readSiteMeta(site);
    const page = await browser.newPage({ bypassCSP: true, viewport: meta.viewport, serviceWorkers: 'block' });
    await routeSite(page, site);

    await page.goto(meta.finalUrl, { waitUntil: 'domcontentloaded' });
    // A HAR can hold a request that never completed (a dead ad host), and replaying it
    // leaves `load` pending forever. The DOM is complete at DOMContentLoaded; the wait is
    // for stylesheets and images, and whatever is still outstanding after it is cancelled.
    await page.waitForLoadState('load', { timeout: LOAD_TIMEOUT_MS }).catch(() => {});
    await page.evaluate(() => window.stop());
    return page;
}
