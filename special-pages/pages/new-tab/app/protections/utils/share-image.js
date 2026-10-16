import { h, render } from 'preact';
import { toCanvas } from 'html-to-image';
import { DAX_SHIELD, REPORT_TILT, ShareScene } from '../components/ShareScene.js';

/** Add to an element (and its children) to leave it out of the captured image */
export const CAPTURE_EXCLUDE = 'data-capture-exclude';

/** Set on the captured element while capturing, so styles can hide or settle parts of it */
export const CAPTURING = 'data-capturing';

/**
 * Output resolution: 1 CSS px per image px. Higher looks marginally crisper but
 * makes the image four times the size and the capture noticeably slower.
 */
const PIXEL_RATIO = 1;

/** 1×1 transparent PNG, used for any image that can't be loaded into the capture */
const TRANSPARENT_PIXEL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

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
    const canvasColor =
        getComputedStyle(node).getPropertyValue(`--default-${theme}-background-color`).trim() || (theme === 'dark' ? '#1c1c1c' : '#ffffff');
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvasColor;
    ctx.canvas.width = 1;
    ctx.canvas.height = 1;
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = getComputedStyle(node).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * The live report card, as an image.
 *
 * @param {HTMLElement} node
 * @param {string} background - solid colour to give the card
 */
async function captureCard(node, background) {
    node.setAttribute(CAPTURING, '');
    try {
        const canvas = await toCanvas(node, {
            pixelRatio: PIXEL_RATIO,
            filter: keep,
            imagePlaceholder: TRANSPARENT_PIXEL,
            // system fonts only; don't try to fetch and embed web fonts
            skipFonts: true,
            style: { margin: '0', backgroundColor: background },
        });
        return canvas;
    } finally {
        node.removeAttribute(CAPTURING);
    }
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
 */

/** Lets the page paint (eg: the button's busy state) before the heavy work starts */
function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

/**
 * Draws the shareable picture of the report card (see `ShareScene`).
 *
 * @param {HTMLElement} node - the report card
 * @param {ShareStrings} strings
 * @return {Promise<Blob>} a PNG
 */
async function renderShareImage(node, strings) {
    await nextFrame();
    const background = solidCardBackground(node);
    const cardRadius = getComputedStyle(node).borderTopLeftRadius;
    const card = await captureCard(node, background);

    // laid out off-screen, inside the page so it picks up the page's fonts
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position: fixed; left: -10000px; top: 0; pointer-events: none;';
    document.body.appendChild(host);
    try {
        /** @type {import('../components/ShareScene.js').ShareSceneProps} */
        const props = {
            cardWidth: node.offsetWidth,
            cardHeight: node.offsetHeight,
            cardRadius,
            cardBackground: background,
            strings,
        };
        render(h(ShareScene, props), host);
        const scene = /** @type {HTMLElement | null} */ (host.firstElementChild);
        if (!scene) throw new Error('share scene did not render');
        // the promo card's height depends on its copy, so measure it, then draw
        // its surface at that size (offset sizes ignore its tilt)
        const promo = /** @type {HTMLElement | null} */ (scene.querySelector('[data-share-promo]'));
        if (promo) render(h(ShareScene, { ...props, promoSize: { width: promo.offsetWidth, height: promo.offsetHeight } }), host);
        await imagesLoaded(scene);
        const canvas = await toCanvas(scene, { pixelRatio: PIXEL_RATIO, imagePlaceholder: TRANSPARENT_PIXEL, skipFonts: true });

        // The report card goes in afterwards, straight onto the canvas: as part
        // of the snapshot (an SVG <foreignObject>), WebKit can leave a large
        // image like it blank.
        const slot = /** @type {HTMLElement | null} */ (scene.querySelector('[data-share-card]'));
        const ctx = canvas.getContext('2d');
        if (!slot || !ctx) throw new Error('nowhere to draw the report card');
        drawTilted(ctx, slot, scene, card, await loadImage(DAX_SHIELD.src));
        return await canvasToPng(canvas);
    } finally {
        render(null, host);
        host.remove();
    }
}

/**
 * Draws the report card (and Dax with the shield, on its corner) into its
 * slot, tilted the same way the slot is.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLElement} slot
 * @param {HTMLElement} scene
 * @param {HTMLCanvasElement} card
 * @param {HTMLImageElement} dax
 */
function drawTilted(ctx, slot, scene, card, dax) {
    // the slot's position before its tilt, relative to the scene
    let x = 0;
    let y = 0;
    for (let el = /** @type {HTMLElement | null} */ (slot); el && el !== scene; el = /** @type {HTMLElement | null} */ (el.offsetParent)) {
        x += el.offsetLeft;
        y += el.offsetTop;
    }
    const { offsetWidth: width, offsetHeight: height } = slot;
    const daxHeight = (DAX_SHIELD.width * dax.naturalHeight) / dax.naturalWidth;

    ctx.save();
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    // rotate about the slot's centre, as CSS does
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((REPORT_TILT * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);
    ctx.drawImage(card, 0, 0, width, height);
    ctx.drawImage(dax, width - DAX_SHIELD.width - DAX_SHIELD.right, DAX_SHIELD.top, DAX_SHIELD.width, daxHeight);
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
