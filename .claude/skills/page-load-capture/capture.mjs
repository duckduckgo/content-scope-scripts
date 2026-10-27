#!/usr/bin/env node
/**
 * Records every painted frame of a page load alongside in-page geometry
 * instrumentation, then reports loading UX problems: flashes, flicker,
 * layout shifts and late content. See SKILL.md.
 */
import { chromium, webkit } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join, resolve, extname, dirname, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const { values: opts } = parseArgs({
    options: {
        url: { type: 'string', default: '' },
        video: { type: 'string', default: '' },
        page: { type: 'string', default: 'new-tab' },
        params: { type: 'string', default: '' },
        browser: { type: 'string', default: 'chromium' },
        scheme: { type: 'string', default: 'dark' },
        'loading-color': { type: 'string', default: '' },
        backdrop: { type: 'string', default: '' },
        cpu: { type: 'string', default: '4' },
        duration: { type: 'string', default: '2500' },
        viewport: { type: 'string', default: '1200x800' },
        runs: { type: 'string', default: '1' },
        out: { type: 'string', default: join(ROOT, 'test-results/page-load-capture') },
        'flash-threshold': { type: 'string', default: '0.15' },
        'shift-threshold': { type: 'string', default: '3' },
        dom: { type: 'boolean', default: true },
        'no-dom': { type: 'boolean', default: false },
    },
});

let [width, height] = opts.viewport.split('x').map(Number);
const flashThreshold = Number(opts['flash-threshold']);
const shiftThreshold = Number(opts['shift-threshold']);
const trackDom = opts.dom && !opts['no-dom'];

const ORIGIN = 'http://special-pages.test';
const BUILD_DIR = join(ROOT, 'build/integration/pages');
const MIME = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
};
const SAMPLE_W = 64;
const SAMPLE_H = 40;
const GRID_COLS = 8;
const GRID_ROWS = 5;

const servingBuild = !opts.url && !opts.video;
if (servingBuild && !existsSync(join(BUILD_DIR, opts.page, 'index.html'))) {
    console.error(`No build found at ${join(BUILD_DIR, opts.page)}. Run \`npm run build\` first.`);
    process.exit(1);
}

const loadingColor = opts['loading-color'] || (opts.scheme === 'dark' ? '#1c1c1c' : '#fafafa');
// `none` leaves the $LOADING_COLOR$ token in place, as platforms that don't substitute it do.
const substituteToken = loadingColor !== 'none';
const backdropColor = opts.backdrop || (substituteToken ? loadingColor : 'white');

/**
 * Native apps show the web view's own background before the document's first paint,
 * so a blank page in that colour stands in for it.
 */
const backdropHtml = `<!doctype html><html><body style="margin:0;background:${backdropColor}"></body></html>`;

function targetUrl() {
    if (opts.video) return opts.video;
    if (opts.url) return opts.url;
    const qs = new URLSearchParams(opts.params).toString();
    return `${ORIGIN}/${opts.page}/${qs ? `?${qs}` : ''}`;
}

/** @param {import('playwright').BrowserContext} context */
async function serveBuild(context) {
    await context.route(`${ORIGIN}/**`, (route) => {
        const url = new URL(route.request().url());
        let path = join(BUILD_DIR, decodeURIComponent(url.pathname));
        if (path.endsWith('/')) path = join(path, 'index.html');
        if (!existsSync(path)) return route.fulfill({ status: 404, body: 'not found' });
        let body = readFileSync(path);
        if (substituteToken && path.endsWith('index.html')) {
            body = Buffer.from(body.toString().replaceAll('$LOADING_COLOR$', loadingColor));
        }
        return route.fulfill({ body, contentType: MIME[extname(path)] ?? 'application/octet-stream' });
    });
}

/**
 * Runs in the page. Times are epoch ms so they line up with captured frames.
 * @param {{ trackDom: boolean, duration: number }} config
 */
function instrument(config) {
    if (location.protocol === 'about:') return;
    const now = () => performance.timeOrigin + performance.now();
    const events = [];
    /** @type {any} */ (window).__loadCapture = { events };

    /** @param {Element} el */
    const describe = (el) => {
        if (!el || !el.tagName) return '?';
        let s = el.tagName.toLowerCase();
        if (el.id) s += `#${el.id}`;
        const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
        if (cls.length) s += `.${cls.join('.')}`;
        for (const attr of el.getAttributeNames()) {
            if (attr.startsWith('data-') && attr !== 'data-theme') {
                s += `[${attr}]`;
                break;
            }
        }
        const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);
        return text ? `${s} "${text}"` : s;
    };
    const rect = (r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });

    const observe = (type, fn) => {
        try {
            new PerformanceObserver((list) => list.getEntries().forEach(fn)).observe({ type, buffered: true });
        } catch {
            // entry type unsupported by this engine
        }
    };
    observe('paint', (e) => events.push({ kind: e.name, t: performance.timeOrigin + e.startTime }));
    observe('largest-contentful-paint', (e) =>
        events.push({
            kind: 'lcp',
            t: performance.timeOrigin + e.startTime,
            element: describe(e.element),
            rect: e.element ? rect(e.element.getBoundingClientRect()) : null,
        }),
    );
    observe('longtask', (e) =>
        events.push({ kind: 'longtask', t: performance.timeOrigin + e.startTime, duration: Math.round(e.duration) }),
    );
    observe('layout-shift', (e) =>
        events.push({
            kind: 'layout-shift',
            t: performance.timeOrigin + e.startTime,
            value: Number(e.value.toFixed(4)),
            sources: (e.sources || []).map((s) => ({ element: describe(s.node), from: rect(s.previousRect), to: rect(s.currentRect) })),
        }),
    );

    if (!config.trackDom) return;

    // Engine-independent shift detection: compare each visible element's position frame to frame.
    /** @type {WeakMap<Element, {x: number, y: number, w: number, h: number}>} */
    const last = new WeakMap();
    const minArea = 400;
    const start = now();
    const tick = () => {
        if (!document.body) {
            requestAnimationFrame(tick);
            return;
        }
        const t = now();
        const vw = innerWidth;
        const vh = innerHeight;
        /** @typedef {{x: number, y: number, w: number, h: number}} Rect */
        /** @type {Map<Element, {dx: number, dy: number, prev: Rect, cur: Rect}>} */
        const moved = new Map();
        for (const el of document.body.querySelectorAll('*')) {
            const r = el.getBoundingClientRect();
            if (r.width * r.height < minArea || r.bottom < 0 || r.right < 0 || r.top > vh || r.left > vw) {
                last.delete(el);
                continue;
            }
            const cur = rect(r);
            const prev = last.get(el);
            last.set(el, cur);
            if (!prev) {
                if (cur.w * cur.h > vw * vh * 0.01) events.push({ kind: 'appear', t, element: describe(el), rect: cur });
                continue;
            }
            const dx = cur.x - prev.x;
            const dy = cur.y - prev.y;
            if (dx || dy) moved.set(el, { dx, dy, prev, cur });
        }
        for (const [el, m] of moved) {
            // Report the outermost element of a group that moved together.
            let ancestor = el.parentElement;
            let carried = false;
            while (ancestor && !carried) {
                const a = moved.get(ancestor);
                carried = !!a && a.dx === m.dx && a.dy === m.dy;
                ancestor = ancestor.parentElement;
            }
            if (carried) continue;
            events.push({ kind: 'move', t, element: describe(el), from: m.prev, to: m.cur, dx: m.dx, dy: m.dy });
        }
        if (t - start < config.duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

async function newContext(browser, extra = {}) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: /** @type {any} */ (opts.scheme), ...extra });
    if (servingBuild) await serveBuild(context);
    await context.addInitScript(instrument, { trackDom, duration: Number(opts.duration) });
    return context;
}

/** @param {import('playwright').Page} page */
async function readEvents(page) {
    try {
        return await page.evaluate(() => /** @type {any} */ (window).__loadCapture?.events ?? []);
    } catch {
        return [];
    }
}

/** Analyses an existing recording, e.g. a native app screen capture. Times are relative to the first frame. */
function captureVideo(runDir) {
    execFileSync('ffmpeg', ['-v', 'error', '-i', resolve(opts.video), '-fps_mode', 'passthrough', join(runDir, 'frame-%04d.png')]);
    // Screen recordings are often variable frame rate, so use each frame's own timestamp.
    const times = execFileSync('ffprobe', [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'frame=best_effort_timestamp_time',
        '-of',
        'csv=p=0',
        resolve(opts.video),
    ])
        .toString()
        .trim()
        .split('\n')
        .map((line) => parseFloat(line) * 1000);
    [width, height] = execFileSync('ffprobe', [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=width,height',
        '-of',
        'csv=p=0:s=x',
        resolve(opts.video),
    ])
        .toString()
        .trim()
        .split('x')
        .map(Number);
    const frames = readdirSync(runDir)
        .filter((f) => f.startsWith('frame-'))
        .sort()
        .map((f, i) => ({ epoch: (times[i] ?? 0) - (times[0] ?? 0), file: join(runDir, f) }));
    return { frames, events: [], navStart: 0 };
}

async function captureChromium(runDir) {
    const browser = await chromium.launch();
    const context = await newContext(browser);
    const page = await context.newPage();
    await page.setContent(backdropHtml);
    const cdp = await context.newCDPSession(page);
    if (Number(opts.cpu) > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opts.cpu) });

    /** @type {{epoch: number, file: string}[]} */
    const frames = [];
    /** @param {number} sessionId */
    const ack = async (sessionId) => {
        try {
            await cdp.send('Page.screencastFrameAck', { sessionId });
        } catch {
            // the session closes while the last frames are in flight
        }
    };
    cdp.on('Page.screencastFrame', async (frame) => {
        const file = join(runDir, `frame-${String(frames.length).padStart(4, '0')}.png`);
        writeFileSync(file, Buffer.from(frame.data, 'base64'));
        frames.push({ epoch: (frame.metadata.timestamp ?? Date.now() / 1000) * 1000, file });
        await ack(frame.sessionId);
    });
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: width, maxHeight: height });
    await page.waitForTimeout(150);
    const navStart = Date.now();
    await page.goto(targetUrl(), { waitUntil: 'commit' });
    await page.waitForTimeout(Number(opts.duration));
    await cdp.send('Page.stopScreencast');
    const events = await readEvents(page);
    await browser.close();
    return { frames, events, navStart };
}

async function captureWebkit(runDir) {
    const browser = await webkit.launch();
    const videoDir = join(runDir, 'video');
    const context = await newContext(browser, { recordVideo: { dir: videoDir, size: { width, height } } });
    const page = await context.newPage();
    const videoStart = Date.now();
    await page.setContent(backdropHtml);
    await page.waitForTimeout(600);
    const navStart = Date.now();
    await page.goto(targetUrl(), { waitUntil: 'commit' });
    await page.waitForTimeout(Number(opts.duration));
    const events = await readEvents(page);
    await context.close();
    await browser.close();
    const video = readdirSync(videoDir).find((f) => f.endsWith('.webm'));
    if (!video) throw new Error('webkit produced no video');
    execFileSync('ffmpeg', ['-v', 'error', '-i', join(videoDir, video), '-fps_mode', 'passthrough', join(runDir, 'frame-%04d.png')]);
    // Frames before the backdrop paints are the recorder's blank canvas, not the page.
    const frames = readdirSync(runDir)
        .filter((f) => f.startsWith('frame-'))
        .sort()
        .map((f, i) => ({ epoch: videoStart + i * 40, file: join(runDir, f) }))
        .filter((f) => f.epoch >= navStart - 100);
    return { frames, events, navStart };
}

/** @param {string} file */
function sample(file) {
    return execFileSync('ffmpeg', [
        '-v',
        'error',
        '-i',
        file,
        '-vf',
        `scale=${SAMPLE_W}:${SAMPLE_H}:flags=area`,
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        '-',
    ]);
}

/** @param {Buffer} px */
function luma(px) {
    let sum = 0;
    for (let i = 0; i < px.length; i += 3) sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    return sum / (px.length / 3) / 255;
}

/** @param {Buffer} a @param {Buffer} b */
function diff(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
    return sum / a.length / 255;
}

/** Grid cells (row-major) whose pixels changed between two samples. */
function changedCells(a, b) {
    const cells = [];
    const cw = SAMPLE_W / GRID_COLS;
    const ch = SAMPLE_H / GRID_ROWS;
    for (let gy = 0; gy < GRID_ROWS; gy++) {
        for (let gx = 0; gx < GRID_COLS; gx++) {
            let sum = 0;
            for (let y = gy * ch; y < (gy + 1) * ch; y++) {
                for (let x = gx * cw; x < (gx + 1) * cw; x++) {
                    const i = (y * SAMPLE_W + x) * 3;
                    sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
                }
            }
            if (sum / (cw * ch * 3) / 255 > 0.02) cells.push(gy * GRID_COLS + gx);
        }
    }
    return cells;
}

function analyse({ frames, events, navStart }) {
    const samples = frames.map((f) => sample(f.file));
    /** @type {number[]} */
    const keep = [];
    for (let i = 0; i < frames.length; i++) {
        if (!keep.length || diff(samples[keep[keep.length - 1]], samples[i]) > 0.002) keep.push(i);
    }
    const final = samples[samples.length - 1];
    const finalLuma = luma(final);
    const states = keep.map((i, n) => {
        const l = luma(samples[i]);
        const prev = n > 0 ? samples[keep[n - 1]] : null;
        return {
            index: n,
            t: Math.round(frames[i].epoch - navStart),
            file: frames[i].file,
            luma: Number(l.toFixed(3)),
            lumaDelta: Number((l - finalLuma).toFixed(3)),
            diffFromFinal: Number(diff(samples[i], final).toFixed(3)),
            diffFromPrev: prev ? Number(diff(samples[i], prev).toFixed(3)) : 0,
            changedCells: prev ? changedCells(prev, samples[i]) : [],
            /** @type {string[]} */
            flags: [],
        };
    });

    for (const [n, s] of states.entries()) {
        // Before navigation the frame shows the backdrop (or the recorder's blank canvas), not the page.
        if (s.t < 0 && !opts.video) continue;
        if (Math.abs(s.lumaDelta) > flashThreshold) s.flags.push('flash');
        const prev = states[n - 1];
        const next = states[n + 1];
        if (prev && next) {
            // A→B→A: the state is a detour that the page then undoes.
            const pa = samples[keep[n - 1]];
            const nb = samples[keep[n + 1]];
            const there = s.diffFromPrev;
            const back = diff(samples[keep[n]], nb);
            if (there > 0.02 && back > 0.02 && diff(pa, nb) < 0.3 * Math.min(there, back)) s.flags.push('flicker');
        }
    }

    const rel = (e) => ({ ...e, t: Math.round(e.t - navStart) });
    const timeline = events.map(rel).sort((a, b) => a.t - b.t);
    const fcp = timeline.find((e) => e.kind === 'first-contentful-paint')?.t ?? timeline.find((e) => e.kind === 'appear')?.t ?? 0;
    const shifts = timeline.filter(
        (e) =>
            (e.kind === 'move' && Math.max(Math.abs(e.dx), Math.abs(e.dy)) >= shiftThreshold) || (e.kind === 'layout-shift' && e.value > 0),
    );
    /** @type {{t: number, elements: string[]}[]} */
    const waves = [];
    for (const e of timeline.filter((e) => e.kind === 'appear')) {
        const wave = waves[waves.length - 1];
        if (wave && e.t - wave.t < 50) wave.elements.push(e.element);
        else waves.push({ t: e.t, elements: [e.element] });
    }
    const settledAt = states[states.length - 1]?.t ?? 0;

    return {
        url: targetUrl(),
        finalLuma: Number(finalLuma.toFixed(3)),
        settledAt,
        fcp,
        states,
        shifts,
        waves,
        longTasks: timeline.filter((e) => e.kind === 'longtask'),
        timeline,
    };
}

function sheetHtml(result, runDir) {
    const scale = 360 / width;
    const box = (r, color) =>
        r
            ? `<div style="position:absolute;left:${r.x * scale}px;top:${r.y * scale}px;width:${Math.max(2, r.w * scale)}px;height:${Math.max(2, r.h * scale)}px;outline:2px solid ${color};"></div>`
            : '';
    const tiles = result.states.map((s, n) => {
        const prevT = n > 0 ? result.states[n - 1].t : -Infinity;
        const shifts = result.shifts.filter((e) => e.t > prevT && e.t <= s.t + 20);
        const overlays = [
            ...s.changedCells.map((c) => {
                const cw = width / GRID_COLS;
                const ch = height / GRID_ROWS;
                return `<div style="position:absolute;left:${(c % GRID_COLS) * cw * scale}px;top:${Math.floor(c / GRID_COLS) * ch * scale}px;width:${cw * scale}px;height:${ch * scale}px;background:rgba(255,200,0,.18)"></div>`;
            }),
            ...shifts.flatMap((e) =>
                e.kind === 'move'
                    ? [box(e.from, 'rgba(0,160,255,.9)'), box(e.to, 'rgba(255,0,200,.9)')]
                    : e.sources.map((src) => box(src.to, 'rgba(255,0,200,.9)')),
            ),
        ];
        const flags = s.flags.map((f) => `<b class="${f}">${f}</b>`).join(' ');
        const notes = shifts.length ? `<div class="note">${shifts.length} shift${shifts.length > 1 ? 's' : ''}</div>` : '';
        return `<figure class="${s.flags.length ? 'bad' : ''}"><div class="img"><img src="${relative(runDir, s.file)}">${overlays.join('')}</div>
<figcaption>#${s.index} · ${s.t}ms · Δluma ${s.lumaDelta >= 0 ? '+' : ''}${s.lumaDelta} ${flags}${notes}</figcaption></figure>`;
    });
    return `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:12px;background:#222;color:#ddd;font:12px system-ui;display:flex;flex-wrap:wrap;gap:10px;width:${6 * 370}px}
figure{margin:0;width:360px;border:3px solid #555}figure.bad{border-color:#f33}
.img{position:relative;width:360px;height:${height * scale}px;overflow:hidden}.img img{width:100%;display:block}
figcaption{padding:4px}b{color:#fff;padding:0 4px;border-radius:3px}b.flash{background:#c00}b.flicker{background:#a50}.note{color:#f0c}
header{width:100%;color:#aaa}
</style><header>${result.url} · red border: flash/flicker · yellow: regions changed since previous state · blue → pink: element position before → after a shift</header>${tiles.join('\n')}`;
}

async function renderSheet(result, runDir) {
    const htmlFile = join(runDir, 'states.html');
    writeFileSync(htmlFile, sheetHtml(result, runDir));
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(pathToFileURL(resolve(htmlFile)).href);
    await page.screenshot({ path: join(runDir, 'states.png'), fullPage: true });
    await browser.close();
    return join(runDir, 'states.png');
}

function printRun(run, result, sheet) {
    console.log(`\nrun ${run}: ${result.states.length} distinct states, settled at ${result.settledAt}ms, FCP ${result.fcp}ms`);
    for (const s of result.states) {
        const flags = s.flags.length ? `  <-- ${s.flags.join(', ').toUpperCase()}` : '';
        console.log(
            `  #${String(s.index).padStart(2)} t=${String(s.t).padStart(5)}ms luma=${s.luma.toFixed(3)} Δluma=${s.lumaDelta >= 0 ? '+' : ''}${s.lumaDelta.toFixed(3)} Δprev=${s.diffFromPrev.toFixed(3)} cells=${s.changedCells.length}${flags}`,
        );
    }
    for (const e of result.shifts) {
        if (e.kind === 'move') console.log(`  shift t=${e.t}ms ${e.element} moved (${e.dx}, ${e.dy})`);
        else console.log(`  layout-shift t=${e.t}ms value=${e.value} ${e.sources.map((s) => s.element).join(', ')}`);
    }
    for (const w of result.waves)
        console.log(`  wave t=${w.t}ms ${w.elements.length} elements appeared, e.g. ${w.elements.slice(0, 3).join(' | ')}`);
    for (const e of result.longTasks) console.log(`  longtask t=${e.t}ms ${e.duration}ms`);
    console.log(`  sheet: ${sheet}`);
}

const runs = Number(opts.runs);
for (const dir of existsSync(opts.out) ? readdirSync(opts.out) : []) {
    if (/^run-\d+$/.test(dir)) rmSync(join(opts.out, dir), { recursive: true, force: true });
}
let problems = 0;
for (let run = 0; run < runs; run++) {
    const runDir = join(opts.out, `run-${run}`);
    mkdirSync(runDir, { recursive: true });
    const capture = opts.video
        ? captureVideo(runDir)
        : opts.browser === 'webkit'
          ? await captureWebkit(runDir)
          : await captureChromium(runDir);
    if (!capture.frames.length) throw new Error('no frames captured');
    const result = analyse(capture);
    writeFileSync(join(runDir, 'report.json'), JSON.stringify(result, null, 2));
    const sheet = await renderSheet(result, runDir);
    printRun(run, result, sheet);
    if (result.states.some((s) => s.flags.length) || result.shifts.length) problems++;
}
console.log(`\n${problems}/${runs} runs had flashes, flicker or shifts`);
process.exitCode = problems ? 1 : 0;
