/**
 * Reads some of the same details about this device that trackers use to
 * recognize it (fingerprinting), so the report can show people what they look
 * like from a tracker's side. Everything stays on the page: nothing here is
 * stored or sent anywhere.
 *
 * Each reader returns `null` when the browser won't say, and never throws.
 */

/**
 * @typedef {object} DeviceDetails
 * @property {string | null} graphics - eg: "Apple M2 · ANGLE (Metal)"
 * @property {{width: number, height: number, colorDepth: number} | null} screen
 * @property {{timeZone: string, language: string} | null} locale
 * @property {{found: number, checked: number} | null} fonts - how many of `FONT_PROBES` are installed
 * @property {{sampleRate: number, channels: number} | null} audio
 * @property {{cores: number, memory: number | null} | null} hardware - memory in GB, only where the browser exposes it
 * @property {number | null} voices - installed speech voices; filled in later by `loadVoices`
 */

/**
 * Common fonts across macOS, Windows and Linux. Browsers can't list installed
 * fonts, but scripts can tell whether a named one is present by measuring text
 * set in it, which is what font fingerprinting does.
 */
export const FONT_PROBES = [
    'Arial',
    'Arial Black',
    'Arial Narrow',
    'Avenir',
    'Baskerville',
    'Calibri',
    'Cambria',
    'Candara',
    'Century Gothic',
    'Comic Sans MS',
    'Consolas',
    'Constantia',
    'Corbel',
    'Courier New',
    'DejaVu Sans',
    'Franklin Gothic Medium',
    'Futura',
    'Garamond',
    'Geneva',
    'Georgia',
    'Gill Sans',
    'Helvetica',
    'Helvetica Neue',
    'Impact',
    'Liberation Sans',
    'Lucida Console',
    'Lucida Grande',
    'Menlo',
    'Monaco',
    'Optima',
    'Palatino',
    'Segoe Print',
    'Segoe Script',
    'Segoe UI',
    'SF Pro',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Ubuntu',
    'Verdana',
];

/**
 * Turns a WebGL renderer string into something readable:
 * "ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)" → "Apple M2 · ANGLE (Metal)"
 * "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002504) Direct3D11 vs_5_0 ps_5_0, D3D11)" → "NVIDIA GeForce RTX 3060 · ANGLE (Direct3D 11)"
 *
 * @param {string} renderer
 * @return {string}
 */
export function formatRenderer(renderer) {
    const angle = /^ANGLE \((.*)\)$/.exec(renderer.trim());
    if (!angle) return renderer.trim();
    const parts = angle[1].split(', ');
    const raw = parts[1] ?? parts[0] ?? '';
    const device = raw
        .replace(/^ANGLE \w+ Renderer: /, '')
        .replace(/\s*\(0x[0-9a-f]+\)/gi, '')
        .replace(/\s+(Direct3D\S*|vs_\S+|ps_\S+)/g, '')
        .trim();
    const backend = backendName(angle[1]);
    if (!device) return renderer.trim();
    return backend ? `${device} · ANGLE (${backend})` : device;
}

/**
 * @param {string} text
 */
function backendName(text) {
    if (/Metal/.test(text)) return 'Metal';
    if (/D3D11|Direct3D11/.test(text)) return 'Direct3D 11';
    if (/D3D9|Direct3D9/.test(text)) return 'Direct3D 9';
    if (/Vulkan/.test(text)) return 'Vulkan';
    if (/OpenGL/.test(text)) return 'OpenGL';
    return null;
}

/** @return {string | null} */
export function readGraphics() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (!gl) return null;
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return typeof renderer === 'string' && renderer ? formatRenderer(renderer) : null;
    } catch {
        return null;
    }
}

/** @return {DeviceDetails['screen']} */
export function readScreen() {
    const { width, height, colorDepth } = window.screen ?? {};
    if (!width || !height) return null;
    return { width, height, colorDepth };
}

/** @return {DeviceDetails['locale']} */
export function readLocale() {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        if (!timeZone || !language) return null;
        return { timeZone, language };
    } catch {
        return null;
    }
}

/** @return {DeviceDetails['fonts']} */
export function readFonts() {
    try {
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) return null;
        const sample = 'mmmmmmmmmmlli';
        const bases = ['monospace', 'sans-serif', 'serif'];
        /** @param {string} font */
        const width = (font) => {
            ctx.font = `72px ${font}`;
            return ctx.measureText(sample).width;
        };
        const baseWidths = bases.map(width);
        // a font is present if text set in it measures differently from the fallback
        const found = FONT_PROBES.filter((name) => bases.some((base, i) => width(`"${name}", ${base}`) !== baseWidths[i])).length;
        return { found, checked: FONT_PROBES.length };
    } catch {
        return null;
    }
}

/** @return {DeviceDetails['audio']} */
export function readAudio() {
    try {
        const Ctx = window.AudioContext;
        if (!Ctx) return null;
        // stays suspended (no sound) since it's not started by a user gesture
        const ctx = new Ctx();
        const details = { sampleRate: ctx.sampleRate, channels: ctx.destination.maxChannelCount };
        closeQuietly(ctx);
        return details.sampleRate ? details : null;
    } catch {
        return null;
    }
}

/**
 * @param {AudioContext} ctx
 */
async function closeQuietly(ctx) {
    try {
        await ctx.close();
    } catch {
        // already closed, nothing to release
    }
}

/** @return {DeviceDetails['hardware']} */
export function readHardware() {
    const cores = navigator.hardwareConcurrency;
    if (!cores) return null;
    // Chromium only, rounded by the browser to a power of two (eg: 8)
    const memory = /** @type {{deviceMemory?: number}} */ (navigator).deviceMemory ?? null;
    return { cores, memory };
}

/** How long to wait for the browser to load its voice list */
const VOICES_TIMEOUT = 1000;

/**
 * Some browsers (Chromium) load the voice list in the background and announce
 * it with `voiceschanged`, so this can take a moment.
 *
 * @return {Promise<number | null>} how many speech voices are installed
 */
export function loadVoices() {
    const synth = window.speechSynthesis;
    if (!synth) return Promise.resolve(null);
    /** @return {number | null} */
    const count = () => synth.getVoices().length || null;
    const now = count();
    if (now) return Promise.resolve(now);
    return new Promise((resolve) => {
        const done = () => {
            clearTimeout(timer);
            synth.removeEventListener('voiceschanged', done);
            resolve(count());
        };
        const timer = setTimeout(done, VOICES_TIMEOUT);
        synth.addEventListener('voiceschanged', done);
    });
}

/** @type {DeviceDetails | null} */
let cached = null;

/**
 * Everything that can be read straight away. `voices` starts out `null`; use
 * `loadVoices` to fill it in.
 *
 * Read once per page: it creates a WebGL and an audio context and measures
 * dozens of fonts, which isn't worth repeating each time the view opens.
 *
 * @return {DeviceDetails}
 */
export function readDeviceDetails() {
    cached ??= {
        graphics: readGraphics(),
        screen: readScreen(),
        locale: readLocale(),
        fonts: readFonts(),
        audio: readAudio(),
        hardware: readHardware(),
        voices: null,
    };
    return cached;
}
