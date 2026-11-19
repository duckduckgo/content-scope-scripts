/**
 * What trackers are trying to do, and what they read to recognize a device, in
 * terms people understand, and how that maps onto Tracker Radar data. Kept
 * free of app imports so the build script that generates
 * `../data/tracker-purposes.js` can use it too.
 *
 * @import { TrackerCategory } from "../../../types/new-tab"
 */

/**
 * Tracker Radar fingerprinting score at or above which a company is treated
 * as fingerprinting. See tracker-radar `docs/DATA_MODEL.md`: 2 = "use of many
 * browser APIs, possibly for tracking purposes".
 */
export const FINGERPRINTING_THRESHOLD = 2;

/**
 * User-facing groupings of Tracker Radar categories. The order breaks ties
 * when sorting groups by how many companies they have.
 * Categories that are not about tracking (CDN, Embedded Content, Badge, etc.)
 * are deliberately absent.
 *
 * @typedef {'advertising' | 'social' | 'fingerprinting' | 'sessionReplay' | 'analytics'} PurposeId
 * @type {{id: PurposeId, categories: TrackerCategory[]}[]}
 */
export const PURPOSES = [
    { id: 'advertising', categories: ['Advertising', 'Ad Motivated Tracking', 'Action Pixels'] },
    { id: 'social', categories: ['Social Network', 'Social - Share', 'Social - Comment'] },
    // fingerprinting is derived from the `fingerprinting` score, not a category
    { id: 'fingerprinting', categories: [] },
    { id: 'sessionReplay', categories: ['Session Replay'] },
    { id: 'analytics', categories: ['Analytics', 'Audience Measurement', 'Third-Party Analytics Marketing'] },
];

/**
 * Things about your device that trackers read to recognize it (fingerprinting),
 * in display order, with the Tracker Radar API names that count as reading
 * them. An API matches if it starts with one of `apis`. Generic APIs that
 * almost every script touches (Date.getTime, userAgent, localStorage) are left
 * out on purpose: they'd make every company look like a fingerprinter.
 *
 * @typedef {'graphics' | 'screen' | 'locale' | 'fonts' | 'audio' | 'hardware' | 'voices'} SurfaceId
 * @type {{id: SurfaceId, apis: string[]}[]}
 */
export const SURFACES = [
    {
        id: 'graphics',
        apis: [
            'WebGLRenderingContext.',
            'WebGL2RenderingContext.',
            'HTMLCanvasElement.prototype.toDataURL',
            'HTMLCanvasElement.prototype.toBlob',
            'CanvasRenderingContext2D.prototype.getImageData',
            'CanvasRenderingContext2D.prototype.isPointInPath',
        ],
    },
    { id: 'screen', apis: ['Screen.prototype.', 'window.devicePixelRatio'] },
    {
        id: 'locale',
        apis: ['Date.prototype.getTimezoneOffset', 'Intl.DateTimeFormat.prototype.resolvedOptions', 'Navigator.prototype.language'],
    },
    {
        id: 'fonts',
        apis: ['CanvasRenderingContext2D.prototype.measureText', 'document.fonts.check', 'CSSStyleDeclaration.setProperty("fontFamily"'],
    },
    { id: 'audio', apis: ['AudioBuffer.', 'OfflineAudioContext.', 'AudioWorkletNode.'] },
    { id: 'hardware', apis: ['Navigator.prototype.hardwareConcurrency', 'Navigator.prototype.deviceMemory'] },
    { id: 'voices', apis: ['speechSynthesis.'] },
];
