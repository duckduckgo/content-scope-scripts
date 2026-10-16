import { h, render } from 'preact';
import { toCanvas } from 'html-to-image';
import { ARROW, REPORT_TILT, ShareScene } from '../components/ShareScene.js';

/** Add to an element (and its children) to leave it out of the captured image */
export const CAPTURE_EXCLUDE = 'data-capture-exclude';

/**
 * Output resolution: 1 CSS px per image px. Higher looks marginally crisper but
 * makes the image four times the size and the capture noticeably slower.
 */
const PIXEL_RATIO = 1;

/** White border around the whole picture, in CSS px */
const FRAME = 12;

/** 1×1 transparent PNG, used for any image that can't be loaded into the capture */
const TRANSPARENT_PIXEL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/** @type {string[] | null} */
let styleProperties = null;

/**
 * The style properties copied onto each element of a snapshot. By default
 * html-to-image copies every property the browser lists, and that includes
 * every CSS variable defined on the page: around 1,600 design tokens, on
 * every element, which made the snapshot tens of MB and took seconds.
 * Computed values already have variables resolved, so they aren't needed
 * (as long as no inline SVG in the card uses `var()`).
 *
 * html-to-image keeps the first list it's given for the life of the page, so
 * every snapshot must use this same list.
 *
 * @return {string[]}
 */
function standardStyleProperties() {
    if (!styleProperties) {
        styleProperties = [...getComputedStyle(document.documentElement)].filter((name) => !name.startsWith('--'));
    }
    return styleProperties;
}

/**
 * @param {Node} node
 */
function keep(node) {
    if (!(node instanceof HTMLElement)) return true;
    // the share button and other controls, plus any open menu or pop-over
    return !node.hasAttribute(CAPTURE_EXCLUDE) && node.getAttribute('role') !== 'menu' && node.getAttribute('role') !== 'dialog';
}

/**
 * The card's background is translucent; on the page it shows the theme's
 * canvas colour through it. Work out the solid colour that results, so the
 * card looks the same in the image without anything showing through.
 *
 * @param {HTMLElement} node
 * @return {string}
 */
function solidCardBackground(node) {
    const theme = node.closest('[data-theme]')?.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const style = getComputedStyle(node);
    const canvasColor = style.getPropertyValue(`--default-${theme}-background-color`).trim() || (theme === 'dark' ? '#1c1c1c' : '#ffffff');
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvasColor;
    ctx.canvas.width = 1;
    ctx.canvas.height = 1;
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * The report card, as an image.
 *
 * @param {HTMLElement} node
 * @param {string} background - solid colour to give the card
 */
function captureCard(node, background) {
    return toCanvas(node, {
        pixelRatio: PIXEL_RATIO,
        filter: keep,
        imagePlaceholder: TRANSPARENT_PIXEL,
        // system fonts only; don't try to fetch and embed web fonts
        skipFonts: true,
        includeStyleProperties: standardStyleProperties(),
        style: { margin: '0', backgroundColor: background },
    });
}

/**
 * @param {HTMLElement} root
 */
async function imagesLoaded(root) {
    const images = [...root.querySelectorAll('img')];
    await Promise.all(
        images.map(async (img) => {
            try {
                await img.decode();
            } catch {
                // a missing image shouldn't stop the rest; the capture uses a placeholder
            }
        }),
    );
}

/**
 * @typedef {import('../components/ShareScene.js').ShareSceneProps['strings']} ShareStrings
 * @typedef {Omit<import('../components/ShareScene.js').ShareSceneProps, 'promoSize'>} SceneProps
 */

/**
 * The scene around the report card, ready to draw the card into.
 *
 * @typedef {object} SceneSnapshot
 * @property {HTMLCanvasElement} canvas - the scene, without the report card; draw a copy, not on it
 * @property {{x: number, y: number, width: number, height: number}} slot - where the report card goes, before its tilt
 * @property {HTMLImageElement} arrow - drawn from the promo copy to the card, over both
 */

/** Lets the page paint (eg: the button's busy state) before the heavy work starts */
function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

/** How many frames to wait for an element that's about to render */
const RENDER_FRAMES = 10;

/**
 * Waits until an element that's about to render (eg: after a state change)
 * is on the page with its images loaded, so it's ready to capture.
 *
 * @param {() => HTMLElement | null} get - the element, once it's rendered
 * @return {Promise<HTMLElement | null>} `null` if it never rendered
 */
export async function whenSettled(get) {
    for (let i = 0; i < RENDER_FRAMES && !get(); i++) await nextFrame();
    const node = get();
    if (!node) return null;
    await imagesLoaded(node);
    // let anything that reacts to its images loading (eg: favicons) render
    await nextFrame();
    await nextFrame();
    return get();
}

/**
 * What the scene depends on: the card's size and colour and the copy, but
 * not what the report says.
 *
 * @param {HTMLElement} node - the report card
 * @param {ShareStrings} strings
 * @return {SceneProps}
 */
function sceneProps(node, strings) {
    return {
        cardWidth: node.offsetWidth,
        cardHeight: node.offsetHeight,
        cardRadius: getComputedStyle(node).borderTopLeftRadius,
        cardBackground: solidCardBackground(node),
        strings,
    };
}

/**
 * @typedef {{key: string, snapshot: Promise<SceneSnapshot>}} SceneEntry
 */

/** @type {SceneEntry | null} */
let lastScene = null;

/**
 * The scene for these props: the last one if nothing it depends on has
 * changed (eg: sharing again, or after `prepareShareImage`), otherwise a new one.
 *
 * @param {SceneProps} props
 * @return {Promise<SceneSnapshot>}
 */
async function sceneSnapshot(props) {
    const key = JSON.stringify(props);
    if (lastScene?.key !== key) lastScene = { key, snapshot: snapshotScene(props) };
    return await settledScene(lastScene);
}

/**
 * @param {SceneEntry} entry
 * @return {Promise<SceneSnapshot>}
 */
async function settledScene(entry) {
    try {
        return await entry.snapshot;
    } catch (e) {
        // don't keep a failure around; the next try draws the scene again
        if (lastScene === entry) lastScene = null;
        throw e;
    }
}

/**
 * Renders the scene off-screen and snapshots it.
 *
 * @param {SceneProps} props
 * @return {Promise<SceneSnapshot>}
 */
async function snapshotScene(props) {
    // laid out off-screen, inside the page so it picks up the page's fonts
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position: fixed; left: -10000px; top: 0; pointer-events: none;';
    document.body.appendChild(host);
    try {
        render(h(ShareScene, props), host);
        const scene = /** @type {HTMLElement | null} */ (host.firstElementChild);
        if (!scene) throw new Error('share scene did not render');
        // the promo card's height depends on its copy, so measure it, then draw
        // its surface at that size (offset sizes ignore its tilt)
        const promo = /** @type {HTMLElement | null} */ (scene.querySelector('[data-share-promo]'));
        if (promo) render(h(ShareScene, { ...props, promoSize: { width: promo.offsetWidth, height: promo.offsetHeight } }), host);
        const slot = /** @type {HTMLElement | null} */ (scene.querySelector('[data-share-card]'));
        if (!slot) throw new Error('nowhere to draw the report card');
        const snapshot = async () => {
            await imagesLoaded(scene);
            return await toCanvas(scene, {
                pixelRatio: PIXEL_RATIO,
                imagePlaceholder: TRANSPARENT_PIXEL,
                skipFonts: true,
                includeStyleProperties: standardStyleProperties(),
            });
        };
        const [canvas, arrow] = await Promise.all([snapshot(), loadImage(ARROW.src)]);
        // Browsers put off drawing the snapshot into the canvas until its
        // pixels are needed, and it's the slowest single step (the shadows
        // and artwork). Reading a pixel makes it happen now, as part of
        // preparing the scene, rather than when the picture is saved.
        canvas.getContext('2d')?.getImageData(0, 0, 1, 1);
        return { canvas, slot: slotPosition(slot, scene), arrow };
    } finally {
        render(null, host);
        host.remove();
    }
}

/**
 * The slot's position before its tilt, relative to the scene.
 *
 * @param {HTMLElement} slot
 * @param {HTMLElement} scene
 */
function slotPosition(slot, scene) {
    let x = 0;
    let y = 0;
    for (let el = /** @type {HTMLElement | null} */ (slot); el && el !== scene; el = /** @type {HTMLElement | null} */ (el.offsetParent)) {
        x += el.offsetLeft;
        y += el.offsetTop;
    }
    return { x, y, width: slot.offsetWidth, height: slot.offsetHeight };
}

/**
 * Gets the slow, data-independent part of the picture (the scene around the
 * card) ready ahead of a share, eg: when the pointer reaches the share button.
 * The card itself is always captured at the moment of sharing, so the picture
 * never shows out-of-date numbers; if the card's size or colour has changed
 * by then, the scene is drawn again.
 *
 * @param {HTMLElement} node - the report card
 * @param {ShareStrings} strings
 */
export async function prepareShareImage(node, strings) {
    try {
        await sceneSnapshot(sceneProps(node, strings));
    } catch {
        // nothing to do: sharing draws the scene again, and reports any error
    }
}

/**
 * Draws the shareable picture of the report card (see `ShareScene`).
 *
 * @param {HTMLElement} node - the report card
 * @param {ShareStrings} strings
 * @return {Promise<Blob>} a PNG
 */
async function renderShareImage(node, strings) {
    // The scene and the card are made one after the other: run together,
    // their steps bunch up into longer freezes. So a scene that's still being
    // prepared finishes first.
    if (lastScene) {
        try {
            await settledScene(lastScene);
        } catch {
            // it's drawn again below
        }
    }
    await nextFrame();
    const props = sceneProps(node, strings);
    const card = await captureCard(node, props.cardBackground);
    const { canvas: sceneCanvas, slot, arrow } = await sceneSnapshot(props);

    // The report card goes in afterwards, straight onto the canvas: as part
    // of the snapshot (an SVG <foreignObject>), WebKit can leave a large
    // image like it blank. Drawn on a copy, so the scene can be used again.
    const frame = FRAME * PIXEL_RATIO;
    const canvas = document.createElement('canvas');
    canvas.width = sceneCanvas.width + frame * 2;
    canvas.height = sceneCanvas.height + frame * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('nowhere to draw the report card');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(frame, frame);
    ctx.drawImage(sceneCanvas, 0, 0);
    drawTilted(ctx, slot, card);
    // the arrow crosses both cards, so it goes on top of everything
    ctx.save();
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    ctx.drawImage(arrow, slot.x + ARROW.left, slot.y + ARROW.top, ARROW.width, ARROW.height);
    ctx.restore();
    return await canvasToPng(canvas);
}

/**
 * Draws the report card into its slot, tilted the same way the slot is.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {SceneSnapshot['slot']} slot
 * @param {HTMLCanvasElement} card
 */
function drawTilted(ctx, { x, y, width, height }, card) {
    ctx.save();
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    // rotate about the slot's centre, as CSS does
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((REPORT_TILT * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);
    ctx.drawImage(card, 0, 0, width, height);
    ctx.restore();
}

/**
 * @param {string} src
 * @return {Promise<HTMLImageElement>}
 */
async function loadImage(src) {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @return {Promise<Blob>}
 */
function canvasToPng(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('share image came out empty'))), 'image/png');
    });
}

/**
 * @param {Blob} blob
 * @param {string} filename
 */
function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    // give the browser a moment to start the download before releasing it
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Makes the shareable picture of the report card and opens the system share
 * sheet with it. Where files can't be shared (or the browser no longer
 * counts this as following the click, because the picture took a while), it
 * downloads the picture instead. Embedded browsers may ignore the download;
 * there's no reliable way to tell.
 *
 * @param {HTMLElement} node - the report card
 * @param {string} filename
 * @param {ShareStrings} strings
 * @return {Promise<'shared' | 'cancelled' | 'downloaded'>}
 */
export async function shareAsImage(node, filename, strings) {
    const blob = await renderShareImage(node, strings);
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file] });
            return 'shared';
        } catch (e) {
            // closing the share sheet isn't an error
            if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
            // otherwise (eg: NotAllowedError when the click is too long ago) fall back to a download
        }
    }
    download(blob, filename);
    return 'downloaded';
}
