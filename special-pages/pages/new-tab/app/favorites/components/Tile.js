import { h } from 'preact';
import cn from 'classnames';
import { useId, useState } from 'preact/hooks';
import { memo } from 'preact/compat';
import styles from './Tile.module.css';
import { DDG_DEFAULT_ICON_SIZE, DDG_FALLBACK_ICON, DDG_FALLBACK_ICON_DARK } from '../constants.js';
import { useItemState } from './PragmaticDND.js';
import { useTypedTranslationWith } from '../../types.js';
import { PlusIcon } from '../../components/Icons.js';
import { urlToColor } from '../getColorForString.js';

/**
 * @import {Favorite} from '../../../types/new-tab'
 * @import enStrings from '../../strings.json'
 */

/**
 * @param {object} props
 * @param {Favorite['url']} props.url
 * @param {Favorite['etldPlusOne']} props.etldPlusOne
 * @param {Favorite['id']} props.id
 * @param {Favorite['title']} props.title
 * @param {string|null|undefined} props.faviconSrc
 * @param {number|null|undefined} props.faviconMax
 * @param {Document['visibilityState']} props.visibility - whether this item is actually visible on screen, or not
 * @param {"dark"|"light"} props.theme
 * @param {number} props.index
 * @param {boolean} props.dropped
 */
export function Tile_({ url, etldPlusOne, faviconSrc, faviconMax, index, title, id, dropped, visibility, theme }) {
    const { state, ref } = useItemState(url, id, {
        kind: 'draggable',
        onPreview: (elem) => {
            elem.classList.add(styles.preview);
            elem.dataset.theme = theme;
        },
    });

    return (
        <a
            class={styles.item}
            tabindex={0}
            role="button"
            href={url}
            data-id={id}
            data-index={index}
            data-dropped={String(dropped)}
            data-edge={'closestEdge' in state && state.closestEdge}
            ref={ref}
        >
            <div class={cn(styles.icon, styles.draggable)}>
                {visibility === 'visible' && (
                    <ImageWithState
                        faviconSrc={faviconSrc}
                        faviconMax={faviconMax || DDG_DEFAULT_ICON_SIZE}
                        title={title}
                        theme={theme}
                        etldPlusOne={etldPlusOne}
                    />
                )}
            </div>
            <div class={styles.text}>{title}</div>
            {state.type === 'is-dragging-over' && state.closestEdge ? <div class={styles.dropper} data-edge={state.closestEdge} /> : null}
        </a>
    );
}

export const Tile = memo(Tile_);

/**
 * @typedef {'loading_favicon_src'
 * | 'did_load_favicon_src'
 * | 'loading_fallback_img'
 * | 'did_load_fallback_img'
 * | 'using_fallback_text'
 * | 'fallback_img_failed'
 * } ImgState
 */
const states = /** @type {Record<ImgState, ImgState>} */ ({
    loading_favicon_src: 'loading_favicon_src',
    did_load_favicon_src: 'did_load_favicon_src',

    loading_fallback_img: 'loading_fallback_img',
    did_load_fallback_img: 'did_load_fallback_img',
    fallback_img_failed: 'fallback_img_failed',

    using_fallback_text: 'using_fallback_text',
});

/**
 *
 * Loads and displays an image for a given webpage.
 *
 * @param {Object} props - The props for the image loader.
 * @param {string|null|undefined} props.faviconSrc - The URL of the favicon image to load.
 * @param {number} props.faviconMax - The maximum size this icon be displayed as
 * @param {string} props.title - The title associated with the image.
 * @param {"light" | "dark"} props.theme - the currently applied theme
 * @param {string|null} props.etldPlusOne - The relevant domain section of the url
 */
function ImageWithState({ faviconSrc, faviconMax, title, etldPlusOne, theme }) {
    const size = Math.min(faviconMax, DDG_DEFAULT_ICON_SIZE);

    // try to use the defined image source
    // prettier-ignore
    const imgsrc = faviconSrc
        ? faviconSrc + '?preferredSize=' + size
        : null;

    // prettier-ignore
    const initialState = (() => {
        /**
         * If the favicon has `src`, always prefer it
         */
        if (imgsrc) return states.loading_favicon_src;
        /**
         * Failing that, use fallback text if possible
         */
        if (etldPlusOne) return states.using_fallback_text;
        /**
         * If we get here, we have no favicon src, and no chance of using fallback text
         */
        return states.loading_fallback_img
    })();

    const [state, setState] = useState(/** @type {ImgState} */ (initialState));

    switch (state) {
        /**
         * These are the happy paths, where we are loading the favicon source and it does not 404
         */
        case states.loading_favicon_src:
        case states.did_load_favicon_src: {
            if (!imgsrc) {
                console.warn('unreachable - must have imgsrc here');
                return null;
            }
            return (
                <img
                    src={imgsrc}
                    class={styles.favicon}
                    alt={`favicon for ${title}`}
                    data-state={state}
                    onLoad={() => setState(states.did_load_favicon_src)}
                    onError={() => {
                        if (etldPlusOne) {
                            setState(states.using_fallback_text);
                        } else {
                            setState(states.loading_fallback_img);
                        }
                    }}
                />
            );
        }
        /**
         * A fallback can be applied when the `etldPlusOne` is there. For example,
         * if `etldPlusOne = 'example.com'`, we can display `Ex` and use the domain name
         * to select a background color.
         */
        case states.using_fallback_text: {
            if (!etldPlusOne) {
                console.warn('unreachable - must have etld+1 here');
                return null;
            }
            /** @type {Record<string, string>|undefined} */
            let style;
            const fallbackColor = urlToColor(etldPlusOne);
            if (fallbackColor) {
                style = { background: fallbackColor };
            }
            const chars = etldPlusOne.slice(0, 2);
            return (
                <div class={cn(styles.favicon, styles.faviconText)} style={style} data-state={state}>
                    <span>{chars[0]}</span>
                    <span>{chars[1]}</span>
                </div>
            );
        }
        /**
         * If we get here, we couldn't load the favicon source OR the fallback text
         * So, we default to a globe icon
         */
        case states.loading_fallback_img:
        case states.did_load_fallback_img: {
            return (
                <img
                    src={theme === 'light' ? DDG_FALLBACK_ICON : DDG_FALLBACK_ICON_DARK}
                    class={styles.favicon}
                    alt={`favicon for ${title}`}
                    data-state={state}
                    onLoad={() => setState(states.did_load_fallback_img)}
                    onError={() => setState(states.fallback_img_failed)}
                />
            );
        }
        default:
            return null;
    }
}

/**
 * Dotted-outline placeholder
 */
export function Placeholder() {
    const id = useId();
    const { state, ref } = useItemState(`PLACEHOLDER-URL-${id}`, `PLACEHOLDER-ID-${id}`, { kind: 'target' });
    return (
        <div class={styles.item} ref={ref} data-edge={'closestEdge' in state && state.closestEdge}>
            <div class={cn(styles.icon, styles.placeholder)} />
            {state.type === 'is-dragging-over' && state.closestEdge ? <div class={styles.dropper} data-edge={state.closestEdge} /> : null}
        </div>
    );
}

/**
 * @param {object} props
 * @param {() => void} props.onClick
 */
function PlusIconWrapper({ onClick }) {
    const id = useId();
    const { t } = useTypedTranslationWith(/** @type {import('../strings.json')} */ ({}));
    const { state, ref } = useItemState(`PLACEHOLDER-URL-${id}`, `PLACEHOLDER-ID-${id}`, { kind: 'target' });
    return (
        <div class={styles.item} ref={ref} data-edge={'closestEdge' in state && state.closestEdge}>
            <button class={cn(styles.icon, styles.plus, styles.draggable)} aria-labelledby={id} onClick={onClick}>
                <PlusIcon />
            </button>
            <div class={styles.text} id={id}>
                {t('favorites_add')}
            </div>
            {state.type === 'is-dragging-over' && state.closestEdge ? <div class={styles.dropper} data-edge={state.closestEdge} /> : null}
        </div>
    );
}

export const PlusIconMemo = memo(PlusIconWrapper);
