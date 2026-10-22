import { h } from 'preact';
import styles from './ShareScene.module.css';

/**
 * Space around the report card in the share image, in CSS px. The promo card
 * above it lines up with the same edges.
 */
const SCENE_GUTTER = 80;

/** Room above and below the report card, in CSS px */
const STAGE = { top: 40, bottom: 84, skyOverlap: 40 };

/** The report card's tilt, in degrees */
export const REPORT_TILT = 3;

/**
 * The hand-drawn arrow from the promo copy down to the report card, relative
 * to the report card's top-left corner before its tilt (CSS px). Drawn last,
 * untilted, over both cards (see share-image.js).
 */
export const ARROW = { src: './protections/share-arrow.png', left: 256, top: -149, width: 160, height: 212 };

/** Intrinsic size of share-background.svg */
const LANDSCAPE = { width: 1402, height: 502 };

/** Hairline around each card, matching the design */
const HAIRLINE = '#EDEDED';

/**
 * A card's surface: a rounded rectangle with a hairline and a soft shadow,
 * drawn as an SVG image. Browsers disagree on how to draw CSS shadows and
 * rounded corners when the scene is saved as an image (WebKit can drop the
 * blur and the corners), but every engine draws images the same way.
 *
 * @param {object} props
 * @param {number} props.width
 * @param {number} props.height
 * @param {number} props.radius
 * @param {string} props.fill
 * @param {{y: number, blur: number, color: string}} props.shadow - like a CSS box-shadow: offset, blur radius, colour
 */
function Surface({ width, height, radius, fill, shadow }) {
    // room for the shadow to spread past the card on every side
    const pad = Math.ceil(shadow.blur * 1.5 + shadow.y);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width + pad * 2}" height="${height + pad * 2}">
        <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="${shadow.y}" stdDeviation="${shadow.blur / 2}" flood-color="${shadow.color}" />
        </filter>
        <rect x="${pad - 0.5}" y="${pad - 0.5}" width="${width + 1}" height="${height + 1}" rx="${radius + 0.5}" fill="${HAIRLINE}" filter="url(#s)" />
        <rect x="${pad}" y="${pad}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" />
    </svg>`;
    return (
        <img
            class={styles.surface}
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
            alt=""
            style={{ left: `${-pad}px`, top: `${-pad}px`, width: `${width + pad * 2}px`, height: `${height + pad * 2}px` }}
        />
    );
}

/**
 * @typedef {object} ShareSceneProps
 * @property {number} cardWidth
 * @property {number} cardHeight
 * @property {string} cardRadius - eg: "12px", taken from the live card
 * @property {string} cardBackground - the live card's solid colour, for the card stacked behind it
 * @property {{width: number, height: number}} [promoSize] - the promo card's size, measured on a first render;
 *   its surface is drawn once this is known (its height depends on the copy)
 * @property {{title: string, body: string, cta: string}} strings - `cta` may contain <b></b>
 */

/**
 * The picture saved by "Share as image": a promo card on a blue sky, then the
 * report card, tilted and stacked on a second card, above a landscape.
 * Rendered off-screen only while preparing or saving it; never shown on the
 * page. The report card itself is drawn into the `data-share-card` slot
 * afterwards.
 *
 * @param {ShareSceneProps} props
 */
export function ShareScene({ cardWidth, cardHeight, cardRadius, cardBackground, strings, promoSize }) {
    const width = cardWidth + SCENE_GUTTER * 2;
    const card = { width: `${cardWidth}px`, height: `${cardHeight}px`, borderRadius: cardRadius };
    const surface = { width: cardWidth, height: cardHeight, radius: parseFloat(cardRadius) || 0 };
    // the landscape fills the bottom, full width; the sky runs down behind its
    // rounded top corners, and below that it's white (under the lily pad)
    const landscapeHeight = width * (LANDSCAPE.height / LANDSCAPE.width);
    const stage = {
        height: `${cardHeight + STAGE.top + STAGE.bottom}px`,
        background: `linear-gradient(to bottom, var(--sky) calc(100% - ${landscapeHeight - STAGE.skyOverlap}px), #fff 0)`,
    };
    return (
        <div
            class={styles.scene}
            style={{
                width: `${width}px`,
                '--gutter': `${SCENE_GUTTER}px`,
                '--stage-top': `${STAGE.top}px`,
            }}
        >
            <div class={styles.sky}>
                <div class={styles.promo} data-share-promo>
                    {promoSize && (
                        <Surface
                            width={promoSize.width}
                            height={promoSize.height}
                            radius={surface.radius}
                            fill="#ffffff"
                            shadow={{ y: 10, blur: 28, color: 'rgba(3, 65, 128, 0.18)' }}
                        />
                    )}
                    <div class={styles.promoText}>
                        <p class={styles.promoTitle}>{strings.title}</p>
                        <p class={styles.promoBody}>{strings.body}</p>
                        <p class={styles.promoCta}>
                            <img class={styles.promoDax} src="./protections/share-dax-tilted.svg" alt="" />
                            {/* trusted, translated copy; <b> marks the address */}
                            <span dangerouslySetInnerHTML={{ __html: strings.cta }} />
                        </p>
                    </div>
                    <img class={styles.daxShield} src="./protections/share-dax-shield.svg" alt="" />
                </div>
            </div>
            <div class={styles.stage} style={stage}>
                <img class={styles.landscape} src="./protections/share-background.svg" alt="" />
                <div class={styles.stack} style={card}>
                    <Surface {...surface} fill={cardBackground} shadow={{ y: 6, blur: 18, color: 'rgba(3, 65, 128, 0.14)' }} />
                </div>
                {/* the report card is drawn into this slot afterwards (see
                    share-image.js): WebKit can leave a large image blank when it's
                    part of the snapshot, so the card isn't */}
                <div class={styles.tilted} style={{ ...card, transform: `rotate(${REPORT_TILT}deg)` }} data-share-card>
                    <Surface {...surface} fill={cardBackground} shadow={{ y: 14, blur: 34, color: 'rgba(3, 65, 128, 0.28)' }} />
                </div>
            </div>
        </div>
    );
}
