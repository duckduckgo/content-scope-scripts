import { h } from 'preact';
import cn from 'classnames';
import { useId } from 'preact/hooks';
import { memo } from 'preact/compat';
import styles from './Tile.module.css';
import { urlToColor } from '../color.js';
import { DDG_DEFAULT_ICON_SIZE, DDG_FALLBACK_ICON } from '../constants.js';
import { useItemState } from './PragmaticDND.js';
import { useTypedTranslationWith } from '../../types.js';
import { PlusIcon } from '../../components/Icons.js';

/**
 * @import {Favorite} from '../../../types/new-tab'
 * @import enStrings from '../../strings.json'
 */

/**
 * @param {object} props
 * @param {Favorite['url']} props.url
 * @param {Favorite['id']} props.id
 * @param {Favorite['title']} props.title
 * @param {string|null|undefined} props.faviconSrc
 * @param {number|null|undefined} props.faviconMax
 * @param {number} props.index
 * @param {boolean} props.dropped
 */
export function Tile_({ url, faviconSrc, faviconMax, index, title, id, dropped }) {
    const { state, ref } = useItemState(url, id);

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
                <ImageLoader faviconSrc={faviconSrc || 'n/a'} faviconMax={faviconMax || DDG_DEFAULT_ICON_SIZE} title={title} url={url} />
            </div>
            <div class={styles.text}>{title}</div>
            {state.type === 'is-dragging-over' && state.closestEdge ? <div class={styles.dropper} data-edge={state.closestEdge} /> : null}
        </a>
    );
}

export const Tile = memo(Tile_);

/**
 * Loads and displays an image for a given webpage.
 *
 * @param {Object} props - The props for the image loader.
 * @param {string} props.faviconSrc - The URL of the favicon image to load.
 * @param {number} props.faviconMax - The maximum size this icon be displayed as
 * @param {string} props.title - The title associated with the image.
 * @param {string} props.url - The URL of the webpage to load the image for.
 */
function ImageLoader({ faviconSrc, faviconMax, title, url }) {
    const imgError = (e) => {
        if (!e.target) return;
        if (!(e.target instanceof HTMLImageElement)) return;
        if (e.target.src === e.target.dataset.fallback) return console.warn('refusing to load same fallback');
        if (e.target.dataset.didTryFallback) {
            e.target.dataset.errored = String(true);
            return;
        }
        e.target.dataset.didTryFallback = String(true);
        e.target.src = e.target.dataset.fallback;
    };

    const imgLoaded = (e) => {
        if (!e.target) return;
        if (!(e.target instanceof HTMLImageElement)) return;
        e.target.dataset.loaded = String(true);
        if (e.target.src.endsWith('other.svg')) {
            return;
        }
        if (e.target.dataset.didTryFallback) {
            e.target.style.background = urlToColor(url);
        }
    };

    const size = Math.min(faviconMax, DDG_DEFAULT_ICON_SIZE);
    const src = faviconSrc + '?preferredSize=' + size;

    return (
        <img
            src={src}
            class={styles.favicon}
            alt={`favicon for ${title}`}
            onLoad={imgLoaded}
            onError={imgError}
            data-src={faviconSrc}
            data-fallback={fallbackSrcFor(url) || DDG_FALLBACK_ICON}
        />
    );
}

/**
 * @param {string|null|undefined} url
 */
function fallbackSrcFor(url) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        const char1 = parsed.hostname.match(/[a-z]/i)?.[0];
        if (char1) {
            return `./letters/${char1}.svg`;
        }
    } catch (e) {}
    return null;
}

/**
 * Dotted-outline placeholder
 */
export function Placeholder() {
    const id = useId();
    const { state, ref } = useItemState(`PLACEHOLDER-URL-${id}`, `PLACEHOLDER-ID-${id}`);
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
    const { state, ref } = useItemState(`PLACEHOLDER-URL-${id}`, `PLACEHOLDER-ID-${id}`);
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
