/**
 * Capture real sites as benchmark fixtures.
 *
 *   node scripts/detector-bench/page-gen/capture-sites.mjs [--sites <json>] [--only <name,...>]
 *                                                          [--out <dir>] [--settle <ms>] [--force]
 *
 * For each site: load it in Chromium while recording a HAR, let it settle, then save the DOM
 * as it stands with every script made inert. `core/site.mjs` replays the result: the saved
 * DOM as the document, everything else from the HAR, nothing executing. So a fixture is the
 * page a detector would have seen at the moment of capture, identical on every run and in
 * every engine.
 *
 * What is kept, and why:
 * - Inline script source stays in place under an unknown `type`. A text condition without
 *   a selector reads `body.textContent`, which includes it, and on many real pages it is
 *   most of the characters such a condition scans.
 * - External scripts lose their `src` (kept as `data-bench-src`), inline handlers are
 *   dropped, and `<meta http-equiv="refresh">` is removed, so nothing on the replayed page
 *   can run or navigate away.
 *
 * What is lost: shadow roots, which `outerHTML` does not serialise. The matcher does not
 * pierce shadow DOM, so detection is unaffected; layout inside custom elements is.
 *
 * Captures go to the gitignored `.bench-variants/sites/`. Real site content is never
 * committed.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import minimist from 'minimist';
import { chromium } from '@playwright/test';
import { SITES_ROOT } from '../core/site.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {object} SiteEntry
 * @property {string} name - Directory name, and the fixture name a spec refers to
 * @property {string} url
 * @property {string} category - Groups sites in the cost matrix
 */

/** Wide enough for desktop layouts, so a `visible` check sees the page most users get. */
const VIEWPORT = { width: 1280, height: 800 };

/**
 * Freeze the page as it stands. Runs in the page; must be self-contained.
 *
 * Works on a clone, so the live page is not mutated mid-capture and the facts below describe
 * what the page itself built.
 *
 * @returns {{ html: string, facts: { elements: number, chars: number, renderedChars: number, scriptChars: number } }}
 */
function freezePage() {
    const clone = /** @type {HTMLElement} */ (document.documentElement.cloneNode(true));

    for (const script of clone.querySelectorAll('script')) {
        const type = script.getAttribute('type');
        if (type !== null) script.setAttribute('data-bench-type', type);
        script.setAttribute('type', 'text/x-bench-inert');
        const src = script.getAttribute('src');
        if (src !== null) {
            script.setAttribute('data-bench-src', src);
            script.removeAttribute('src');
        }
    }
    for (const el of clone.querySelectorAll('*')) {
        for (const attr of [...el.attributes]) {
            if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
        }
    }
    for (const meta of clone.querySelectorAll('meta[http-equiv]')) {
        if ((meta.getAttribute('http-equiv') || '').toLowerCase() === 'refresh') meta.remove();
    }
    for (const link of clone.querySelectorAll('link[rel="modulepreload"], link[rel="preload"][as="script"]')) {
        link.remove();
    }

    const body = document.body;
    return {
        html: `<!DOCTYPE html>\n${clone.outerHTML}`,
        facts: {
            elements: document.getElementsByTagName('*').length,
            chars: (body?.textContent || '').length,
            renderedChars: (body?.innerText || '').length,
            scriptChars: [...(body?.querySelectorAll('script') ?? [])].reduce((sum, s) => sum + (s.textContent || '').length, 0),
        },
    };
}

/**
 * Capture one site into `<outRoot>/<name>/`.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {SiteEntry} site
 * @param {string} outRoot
 * @param {{ settleMs?: number, userAgent?: string }} [options]
 * @returns {Promise<{ dir: string, facts: ReturnType<typeof freezePage>['facts'], finalUrl: string }>}
 */
export async function captureSite(browser, site, outRoot, { settleMs = 10000, userAgent } = {}) {
    const dir = path.join(outRoot, site.name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });

    const harPath = path.join(dir, 'har.zip');
    const context = await browser.newContext({
        viewport: VIEWPORT,
        userAgent,
        recordHar: { path: harPath, content: 'attach' },
    });
    try {
        const page = await context.newPage();
        await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        // Some pages never fire load (a hung ad request); the settle below still applies.
        await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(settleMs);

        const { html, facts } = await page.evaluate(freezePage);
        const finalUrl = page.url();
        writeFileSync(path.join(dir, 'page.html'), html);
        writeFileSync(
            path.join(dir, 'meta.json'),
            JSON.stringify(
                {
                    name: site.name,
                    category: site.category,
                    url: site.url,
                    finalUrl,
                    capturedAt: new Date().toISOString(),
                    userAgent: await page.evaluate(() => navigator.userAgent),
                    viewport: VIEWPORT,
                    settleMs,
                    facts,
                },
                null,
                2,
            ),
        );
        return { dir, facts, finalUrl };
    } finally {
        // The HAR is written on close.
        await context.close();
    }
}

/**
 * Headless Chromium announces itself in its user agent, and many large sites serve that a
 * challenge page instead of the site. The same version, minus the tell.
 *
 * @param {import('@playwright/test').Browser} browser
 * @returns {string}
 */
function desktopUserAgent(browser) {
    return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Safari/537.36`;
}

async function main() {
    const argv = minimist(process.argv.slice(2), {
        string: ['sites', 'only', 'out'],
        boolean: ['force', 'help'],
        default: { settle: 10000 },
    });
    if (argv.help) {
        console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
        return;
    }

    const sitesPath = path.resolve(process.cwd(), argv.sites ?? path.join(here, 'sites.json'));
    /** @type {SiteEntry[]} */
    const sites = JSON.parse(readFileSync(sitesPath, 'utf8')).sites;
    const only = argv.only ? String(argv.only).split(',') : null;
    const outRoot = path.resolve(process.cwd(), argv.out ?? SITES_ROOT);
    const settleMs = Number(argv.settle);

    const browser = await chromium.launch();
    const userAgent = desktopUserAgent(browser);
    let failures = 0;
    try {
        for (const site of sites) {
            if (only && !only.includes(site.name)) continue;
            if (!argv.force && existsSync(path.join(outRoot, site.name, 'meta.json'))) {
                console.log(`${site.name}: already captured (--force to redo)`);
                continue;
            }
            try {
                const { facts, finalUrl } = await captureSite(browser, site, outRoot, { settleMs, userAgent });
                console.log(
                    `${site.name}: ${facts.elements.toLocaleString()} elements, ${facts.renderedChars.toLocaleString()} rendered chars, ` +
                        `${facts.scriptChars.toLocaleString()} inline script chars${finalUrl !== site.url ? ` (now ${finalUrl})` : ''}`,
                );
            } catch (e) {
                failures++;
                console.error(`${site.name}: capture failed - ${e instanceof Error ? e.message.split('\n')[0] : e}`);
            }
        }
    } finally {
        await browser.close();
    }
    if (failures > 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    await main();
}
