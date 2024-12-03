import { Fragment, h } from 'preact';
import { useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { memo } from 'preact/compat';
import cn from 'classnames';

import styles from './Favorites.module.css';
import { ShowHideButton } from '../../components/ShowHideButton.jsx';
import { useTypedTranslationWith } from '../../types.js';
import { usePlatformName } from '../../settings.provider.js';
import { useDropzoneSafeArea } from '../../dropzone.js';
import { TileRow } from './TileRow.js';
import { FavoritesContext } from './FavoritesProvider.js';

/**
 * @typedef {import('../../../types/new-tab.js').Expansion} Expansion
 * @typedef {import('../../../types/new-tab.js').Favorite} Favorite
 * @typedef {import('../../../types/new-tab.js').FavoritesOpenAction['target']} OpenTarget
 */
export const FavoritesMemo = memo(Favorites);
export const ROW_CAPACITY = 6;
/**
 * Note: These values MUST match exactly what's defined in the CSS.
 */
const ITEM_HEIGHT = 98;
const ROW_GAP = 8;

/**
 * Favorites Grid.
 *
 * @param {object} props
 * @param {import("preact").Ref<any>} [props.gridRef]
 * @param {Favorite[]} props.favorites
 * @param {Expansion} props.expansion
 * @param {() => void} props.toggle
 * @param {(id: string) => void} props.openContextMenu
 * @param {(id: string, url: string, target: OpenTarget) => void} props.openFavorite
 * @param {() => void} props.add
 */
export function Favorites({ gridRef, favorites, expansion, toggle, openContextMenu, openFavorite, add }) {
    const { t } = useTypedTranslationWith(/** @type {import('../strings.json')} */ ({}));

    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId();
    const TOGGLE_ID = useId();

    const hiddenCount = expansion === 'collapsed' ? favorites.length - ROW_CAPACITY : 0;
    const rowHeight = ITEM_HEIGHT + ROW_GAP;
    const canToggleExpansion = favorites.length >= ROW_CAPACITY;

    return (
        <div class={cn(styles.root, !canToggleExpansion && styles.bottomSpace)} data-testid="FavoritesConfigured">
            <VirtualizedGridRows
                WIDGET_ID={WIDGET_ID}
                favorites={favorites}
                rowHeight={rowHeight}
                add={add}
                expansion={expansion}
                openFavorite={openFavorite}
                openContextMenu={openContextMenu}
            />
            {canToggleExpansion && (
                <div
                    className={cn({
                        [styles.showhide]: true,
                        [styles.showhideVisible]: canToggleExpansion,
                    })}
                >
                    <ShowHideButton
                        buttonAttrs={{
                            'aria-expanded': expansion === 'expanded',
                            'aria-pressed': expansion === 'expanded',
                            'aria-controls': WIDGET_ID,
                            id: TOGGLE_ID,
                        }}
                        text={
                            expansion === 'expanded' ? t('favorites_show_less') : t('favorites_show_more', { count: String(hiddenCount) })
                        }
                        onClick={toggle}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * Favorites Grid. This will take a list of Favorites, split it into chunks (rows)
 * and then layout the rows based on an offset from the top of the container.
 *
 * Doing this means we can just render the items in the current viewport
 *
 * @param {object} props
 * @param {string} props.WIDGET_ID
 * @param {number} props.rowHeight
 * @param {Expansion} props.expansion
 * @param {Favorite[]} props.favorites
 * @param {(id: string) => void} props.openContextMenu
 * @param {(id: string, url: string, target: OpenTarget) => void} props.openFavorite
 * @param {() => void} props.add
 */
function VirtualizedGridRows({ WIDGET_ID, rowHeight, favorites, expansion, openFavorite, openContextMenu, add }) {
    const platformName = usePlatformName();

    // convert the list of favorites into chunks of length ROW_CAPACITY
    const rows = useMemo(() => {
        const chunked = [];
        let inner = [];
        for (let i = 0; i < favorites.length; i++) {
            inner.push(favorites[i]);
            if (inner.length === ROW_CAPACITY) {
                chunked.push(inner.slice());
                inner = [];
            }
            if (i === favorites.length - 1) {
                chunked.push(inner.slice());
                inner = [];
            }
        }
        return chunked;
    }, [favorites]);

    // get a ref for the favorites' grid, this will allow it to receive drop events,
    // and the ref can also be used for reading the offset (eg: if other elements are above it)
    const safeAreaRef = /** @type {import("preact").RefObject<HTMLDivElement>} */ (useDropzoneSafeArea());
    const containerHeight = expansion === 'collapsed' ? rowHeight : rows.length * rowHeight;

    return (
        <div
            className={styles.grid}
            style={{ height: containerHeight + 'px' }}
            id={WIDGET_ID}
            ref={safeAreaRef}
            onContextMenu={getContextMenuHandler(openContextMenu)}
            onClick={getOnClickHandler(openFavorite, platformName)}
        >
            {rows.length === 0 && <TileRow key={'empty-rows'} items={[]} topOffset={0} add={add} />}
            {rows.length > 0 && <Inner rows={rows} safeAreaRef={safeAreaRef} rowHeight={rowHeight} add={add} />}
        </div>
    );
}

/**
 * This is a potentially expensive operation. Especially when going from 'collapsed' to expanded. So, we force
 * the tiles to render after the main thread is cleared by NOT using the 'expansion' from the parent, but instead
 * subscribing to the same update asynchronously. If we accepted the 'expansion' prop in this component and used
 * it directly, it would cause the browser to lock up (on slow devices) when expanding from 1 row to a full screen.
 *
 * @param {object} props
 * @param {Favorite[][]} props.rows
 * @param {import("preact").RefObject<HTMLDivElement>} props.safeAreaRef
 * @param {number} props.rowHeight
 * @param {()=>void} props.add
 */
function Inner({ rows, safeAreaRef, rowHeight, add }) {
    const { onConfigChanged, state } = useContext(FavoritesContext);
    const [expansion, setExpansion] = useState(state.config?.expansion || 'collapsed');

    // force the children to be rendered after the main thread is cleared
    useEffect(() => {
        return onConfigChanged((config) => {
            // when expanding, wait for the main thread to be clear
            if (config.expansion === 'expanded') {
                setTimeout(() => {
                    setExpansion(config.expansion);
                }, 0);
            } else {
                setExpansion(config.expansion);
            }
        });
    }, [onConfigChanged]);

    // set the start/end indexes of the elements
    const [{ start, end }, setVisibleRange] = useState({ start: 0, end: 1 });

    // hold a mutable value that we update on resize
    const gridOffset = useRef(0);

    // When called, make the expensive call to `getBoundingClientRect` to determine the offset of
    // the grid wrapper.
    function updateGlobals() {
        if (!safeAreaRef.current) return;
        const rec = safeAreaRef.current.getBoundingClientRect();
        gridOffset.current = rec.y + window.scrollY;
    }

    // decide which the start/end indexes should be, based on scroll position.
    // NOTE: this is called on scroll, so must not incur expensive checks/measurements - math only!
    function setVisibleRows() {
        if (!safeAreaRef.current) return console.warn('cannot access ref');
        if (!gridOffset.current) return console.warn('cannot access ref');
        const offset = gridOffset.current;
        const end = window.scrollY + window.innerHeight - offset;
        let start;
        if (offset > window.scrollY) {
            start = 0;
        } else {
            start = window.scrollY - offset;
        }
        const startIndex = Math.floor(start / rowHeight);
        const endIndex = Math.min(Math.ceil(end / rowHeight), rows.length);
        setVisibleRange({ start: startIndex, end: endIndex });
    }

    useLayoutEffect(() => {
        // always update globals first
        updateGlobals();

        // and set visible rows once the size is known
        setVisibleRows();

        const controller = new AbortController();

        window.addEventListener(
            'resize',
            () => {
                updateGlobals();
                setVisibleRows();
            },
            { signal: controller.signal },
        );

        window.addEventListener(
            'scroll',
            () => {
                setVisibleRows();
            },
            { signal: controller.signal },
        );

        return () => {
            controller.abort();
        };
    }, [rows.length]);

    // now, we decide which items to show based on the widget expansion
    // prettier-ignore
    const subsetOfRowsToRender = expansion === 'collapsed'
        // if it's 'collapsed', just 1 row to show (the first one)
        ? [rows[0]]
        // otherwise, select the window between start/end
        // the '+ 1' is an additional row to render offscreen - which helps with keyboard navigation.
        : rows.slice(start, end + 1);

    // read a global property on <html> to determine if an element was recently dropped.
    // this is used for animation (the pulse) - it's easier this way because the act of dropping
    // a tile can cause it to render inside a different row, meaning the `key` is invalidated and so the dom-node is recreated
    const dropped = document.documentElement.dataset.dropped;

    return (
        <Fragment>
            {subsetOfRowsToRender.map((items, rowIndex) => {
                const topOffset = expansion === 'expanded' ? (start + rowIndex) * rowHeight : 0;
                const keyed = `-${start + rowIndex}-`;
                return <TileRow key={keyed} dropped={dropped} items={items} topOffset={topOffset} add={add} />;
            })}
        </Fragment>
    );
}

/**
 * Handle right-clicks
 *
 * @param {(id: string) => void} openContextMenu
 */
function getContextMenuHandler(openContextMenu) {
    /**
     * @param {MouseEvent} event
     */
    return (event) => {
        let target = /** @type {HTMLElement|null} */ (event.target);
        while (target && target !== event.currentTarget) {
            if (typeof target.dataset.id === 'string' && 'href' in target && typeof target.href === 'string') {
                event.preventDefault();
                event.stopImmediatePropagation();
                return openContextMenu(target.dataset.id);
            } else {
                target = target.parentElement;
            }
        }
    };
}

/**
 * Following a click on a favorite, walk up the DOM from the clicked
 * element to find the <a>. This is done to prevent needing a click handler
 * on every element.
 * @param {(id: string, url: string, target: OpenTarget) => void} openFavorite
 * @param {ImportMeta['platform']} platformName
 */
function getOnClickHandler(openFavorite, platformName) {
    /**
     * @param {MouseEvent} event
     */
    return (event) => {
        let target = /** @type {HTMLElement|null} */ (event.target);
        while (target && target !== event.currentTarget) {
            if (typeof target.dataset.id === 'string' && 'href' in target && typeof target.href === 'string') {
                event.preventDefault();
                event.stopImmediatePropagation();
                const isControlClick = platformName === 'macos' ? event.metaKey : event.ctrlKey;
                if (isControlClick) {
                    return openFavorite(target.dataset.id, target.href, 'new-tab');
                } else if (event.shiftKey) {
                    return openFavorite(target.dataset.id, target.href, 'new-window');
                }
                return openFavorite(target.dataset.id, target.href, 'same-tab');
            } else {
                target = target.parentElement;
            }
        }
    };
}
