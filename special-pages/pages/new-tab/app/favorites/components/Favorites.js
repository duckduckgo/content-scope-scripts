import { h } from 'preact';
import { useId, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { memo } from 'preact/compat';
import cn from 'classnames';

import styles from './Favorites.module.css';
import { ShowHideButton } from '../../components/ShowHideButton.jsx';
import { useTypedTranslationWith } from '../../types.js';
import { usePlatformName } from '../../settings.provider.js';
import { useDropzoneSafeArea } from '../../dropzone.js';
import { TileRow } from './TileRow.js';

/**
 * @typedef {import('../../../../../types/new-tab.js').Expansion} Expansion
 * @typedef {import('../../../../../types/new-tab.js').Favorite} Favorite
 * @typedef {import('../../../../../types/new-tab.js').FavoritesOpenAction['target']} OpenTarget
 */
export const FavoritesMemo = memo(Favorites);
export const ROW_CAPACITY = 6;

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
    const ITEM_HEIGHT = 98;
    const ROW_GAP = 8;
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
 * Favorites Grid.
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

    const platformName = usePlatformName();
    const safeAreaRef = /** @type {import("preact").RefObject<HTMLDivElement>} */ (useDropzoneSafeArea());
    const [{ start, end }, setSlice] = useState({ start: 0, end: 1 });
    const gridOffset = useRef(0);

    function updateGlobals() {
        if (!safeAreaRef.current) return console.warn('cannot access curren');
        const rec = safeAreaRef.current.getBoundingClientRect();
        gridOffset.current = rec.y + window.scrollY;
    }

    function setVisibleRows() {
        if (!safeAreaRef.current) return console.warn('cannot access ref');
        if (!gridOffset.current) return console.warn('cannot access ref');
        const offset = gridOffset.current;
        let end = window.scrollY + window.innerHeight - offset;
        let start;
        if (offset > window.scrollY) {
            start = 0;
        } else {
            start = window.scrollY - offset;
        }
        let start_index = Math.floor(start / rowHeight);
        let end_index = Math.min(Math.ceil(end / rowHeight), rows.length);
        setSlice({ start: start_index, end: end_index });
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

    // prettier-ignore
    const subsetOfRowsToRender = expansion === 'collapsed'
        // if it's collapsed, just 1 row to show (the first one)
        ? [rows[0]]
        // otherwise select the window between start/end
        : rows.slice(start, end);

    //
    const inline_height = expansion === 'collapsed' ? rowHeight : rows.length * rowHeight;
    return (
        <div
            className={styles.grid}
            style={{ height: inline_height + 'px' }}
            id={WIDGET_ID}
            ref={safeAreaRef}
            onContextMenu={getContextMenuHandler(openContextMenu)}
            onClick={getOnClickHandler(openFavorite, platformName)}
        >
            {subsetOfRowsToRender.map((items, index) => {
                const top_offset = (start + index) * rowHeight;
                const keyed = `-${start + index}-`;
                return <TileRow key={keyed} items={items} top_offset={top_offset} add={add} />;
            })}
        </div>
    );
}

/**
 * @param {(id: string) => void} openContextMenu
 */
function getContextMenuHandler(openContextMenu) {
    /**
     * @param {MouseEvent} event
     */
    return (event) => {
        let target = /** @type {HTMLElement|null} */ (event.target);
        while (target && target !== event.currentTarget) {
            if (typeof target.dataset.id === 'string') {
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
