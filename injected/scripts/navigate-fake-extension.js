#!/usr/bin/env node
/* eslint-disable no-undef -- page.evaluate callbacks run in browser context */
/**
 * Automation script that launches Chrome with the C-S-S fake extension loaded,
 * navigates DuckDuckGo SERP, clicks through organic results, and records a video.
 *
 * Usage:
 *   node scripts/navigate-fake-extension.js [options]
 *   npm run navigate-extension -- [options]
 *
 * Options:
 *   --query <term>       Search query (default: "privacy tools 2026")
 *   --output-dir <path>  Directory for video output (default: ./recordings)
 *   --results <n>        Number of results to click through (default: 3)
 *   --pause <ms>         Pause duration on each page in ms (default: 3000)
 *   --headed             Show the browser (requires a display)
 *
 * On headless Linux, run under xvfb-run:
 *   xvfb-run --server-args='-screen 0 1280x720x24' npm run navigate-extension
 *
 * Or use the convenience wrapper:
 *   npm run navigate-extension-x
 */
import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import { mkdirSync, mkdtempSync, rmSync, readdirSync, renameSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptFile);
const INJECTED_ROOT = resolve(scriptDir, '..');
const EXTENSION_DIR = resolve(INJECTED_ROOT, 'integration-test', 'extension');

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const { values: args } = parseArgs({
    options: {
        query: { type: 'string', default: 'privacy tools 2026' },
        'output-dir': { type: 'string', default: join(INJECTED_ROOT, 'recordings') },
        results: { type: 'string', default: '3' },
        pause: { type: 'string', default: '3000' },
        headed: { type: 'boolean', default: false },
    },
    strict: false,
});

const SEARCH_QUERY = args.query ?? 'privacy tools 2026';
const OUTPUT_DIR = resolve(args['output-dir'] ?? join(INJECTED_ROOT, 'recordings'));
const RESULT_COUNT = parseInt(args.results ?? '3', 10);
const PAUSE_MS = parseInt(args.pause ?? '3000', 10);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run a shell command and stream output.
 * @param {string} cmd
 * @param {string[]} cmdArgs
 * @param {object} [opts]
 * @returns {Promise<void>}
 */
function run(cmd, cmdArgs, opts = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true, cwd: INJECTED_ROOT, ...opts });
        proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))));
        proc.on('error', reject);
    });
}

/**
 * Log with timestamp prefix.
 * @param  {...any} messageParts
 */
function log(...messageParts) {
    const ts = new Date().toISOString().slice(11, 23);
    console.log(`[${ts}]`, ...messageParts);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    // 1. Build the integration entry point so contentScope.js is fresh
    log('Building integration entry point...');
    await run('npm', ['run', 'bundle-entry-points']);
    log('Build complete.');

    // 2. Ensure output directory exists
    mkdirSync(OUTPUT_DIR, { recursive: true });

    // 3. Create a temp video dir (Playwright writes .webm files here)
    const videoTmpDir = mkdtempSync(join(tmpdir(), 'css-nav-video-'));

    // 4. Create temp user data dir for persistent context
    const dataDir = mkdtempSync(join(tmpdir(), 'css-nav-data-'));

    /** @type {import('@playwright/test').BrowserContext | null} */
    let context = null;

    try {
        // 5. Launch Chromium with the fake extension
        log('Launching Chromium with fake extension...');
        context = await chromium.launchPersistentContext(dataDir, {
            headless: false,
            viewport: { width: 1280, height: 720 },
            args: [
                `--disable-extensions-except=${EXTENSION_DIR}`,
                `--load-extension=${EXTENSION_DIR}`,
                '--no-first-run',
                '--disable-default-apps',
                '--disable-popup-blocking',
            ],
            recordVideo: {
                dir: videoTmpDir,
                size: { width: 1280, height: 720 },
            },
            ignoreHTTPSErrors: true,
        });

        // Get the first page (Chromium opens one by default)
        const page = context.pages()[0] || (await context.newPage());

        // Listen to console for C-S-S init logs
        page.on('console', (msg) => {
            const text = msg.text();
            if (text.includes('ContentScopeScripts') || text.includes('content-scope') || text.includes('[DDG]')) {
                log('  [browser]', text);
            }
        });

        // 6. Navigate to DuckDuckGo SERP
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(SEARCH_QUERY)}`;
        log(`Navigating to SERP: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for results to render. DDG SERP uses various selectors across versions;
        // use a broad approach: wait for links within the results area.
        log('Waiting for search results...');
        await page
            .waitForSelector('[data-testid="result"], article[data-nrn="result"], .result__a, [data-layout="organic"] a', {
                timeout: 15000,
            })
            .catch(() => {
                // Fallback: just wait for any h2 link, which most SERPs have
                return page.waitForSelector('h2 a[href]', { timeout: 10000 });
            });

        log(`SERP loaded. Pausing ${PAUSE_MS}ms for recording...`);
        await page.waitForTimeout(PAUSE_MS);

        // 7. Collect organic result links
        // DDG renders result links in various ways. Extract <a> tags that look like organic results.
        const resultLinks = await page.evaluate(() => {
            /** @type {string[]} */
            const hrefs = [];
            // Try modern DDG SERP selectors
            /** @type {NodeListOf<HTMLAnchorElement>} */
            const anchors =
                document.querySelectorAll('[data-testid="result-title-a"]') ||
                document.querySelectorAll('article[data-nrn="result"] h2 a') ||
                document.querySelectorAll('.result__a');

            if (anchors.length > 0) {
                anchors.forEach((a) => {
                    if (a.href && a.href.startsWith('http') && !a.href.includes('duckduckgo.com')) {
                        hrefs.push(a.href);
                    }
                });
            }

            // Broader fallback: any h2 > a that links externally
            if (hrefs.length === 0) {
                document.querySelectorAll('h2 a[href]').forEach((a) => {
                    const href = /** @type {HTMLAnchorElement} */ (a).href;
                    if (href && href.startsWith('http') && !href.includes('duckduckgo.com')) {
                        hrefs.push(href);
                    }
                });
            }

            // Even broader: any a[data-testid] that links externally
            if (hrefs.length === 0) {
                document.querySelectorAll('a[href^="http"]').forEach((a) => {
                    const href = /** @type {HTMLAnchorElement} */ (a).href;
                    if (href && !href.includes('duckduckgo.com') && !href.includes('duck.com')) {
                        hrefs.push(href);
                    }
                });
            }

            // Deduplicate while preserving order
            return [...new Set(hrefs)];
        });

        const clickCount = Math.min(RESULT_COUNT, resultLinks.length);
        log(`Found ${resultLinks.length} organic result links. Will click through ${clickCount}.`);

        if (clickCount === 0) {
            log('WARNING: No organic results found to click. The recording will only show the SERP.');
        }

        // 8. Click through results
        for (let i = 0; i < clickCount; i++) {
            const url = resultLinks[i];
            log(`[${i + 1}/${clickCount}] Navigating to: ${url}`);

            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            } catch (err) {
                log(`  Page load timeout/error for ${url}, continuing...`);
            }

            log(`  On page: ${page.url()}`);
            log(`  Pausing ${PAUSE_MS}ms...`);
            await page.waitForTimeout(PAUSE_MS);

            // Scroll down a bit to show page content
            await page.evaluate(() => window.scrollBy(0, 300));
            await page.waitForTimeout(1000);

            // Navigate back to SERP (except on last result)
            if (i < clickCount - 1) {
                log('  Going back to SERP...');
                await page.goBack({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {
                    // If goBack fails, navigate directly
                    return page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
                });
                await page.waitForTimeout(1500);
            }
        }

        // Final pause on last page
        log('Navigation sequence complete. Final pause...');
        await page.waitForTimeout(2000);

        // 9. Close context to finalize video
        log('Closing browser to finalize video...');
        await page.close();
        await context.close();
        context = null;

        // 10. Move video to output directory with a descriptive name
        const videoFiles = readdirSync(videoTmpDir).filter((f) => f.endsWith('.webm'));
        if (videoFiles.length === 0) {
            log('WARNING: No video files found. Recording may have failed.');
        } else {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const querySlug = SEARCH_QUERY.replace(/\s+/g, '-')
                .replace(/[^a-zA-Z0-9-]/g, '')
                .slice(0, 40);
            const destName = `fake-extension-${querySlug}-${timestamp}.webm`;
            const destPath = join(OUTPUT_DIR, destName);
            renameSync(join(videoTmpDir, videoFiles[0]), destPath);
            log(`✅ Recording saved: ${destPath}`);
        }
    } catch (err) {
        console.error('Fatal error:', err);
        process.exitCode = 1;
    } finally {
        // Ensure context is closed
        if (context) {
            try {
                await context.close();
            } catch {
                /* already closed */
            }
        }

        // Clean up temp directories
        try {
            rmSync(dataDir, { recursive: true, force: true });
        } catch {
            /* best effort */
        }
        try {
            rmSync(videoTmpDir, { recursive: true, force: true });
        } catch {
            /* best effort */
        }
    }
}

main();
