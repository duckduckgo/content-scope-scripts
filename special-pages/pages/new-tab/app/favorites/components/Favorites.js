import { h } from 'preact';
import { useId, useMemo } from 'preact/hooks';
import { memo } from 'preact/compat';
import cn from 'classnames';

import styles from './Favorites.module.css';
import { Placeholder, PlusIconMemo, TileMemo } from './Tile.js';
import { ShowHideButton } from '../../components/ShowHideButton.jsx';
import { useTypedTranslation } from '../../types.js';
import { usePlatformName } from '../../settings.provider.js';

/**
 * @typedef {import('../../../../../types/new-tab.js').Expansion} Expansion
 * @typedef {import('../../../../../types/new-tab.js').Favorite} Favorite
 * @typedef {import('../../../../../types/new-tab.js').FavoritesOpenAction['target']} OpenTarget
 */
export const FavoritesMemo = memo(Favorites);

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
    const platformName = usePlatformName();
    const { t } = useTypedTranslation();

    const ROW_CAPACITY = 6;

    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId();
    const TOGGLE_ID = useId();

    const ITEM_PREFIX = useId();
    const placeholders = calculatePlaceholders(favorites.length, ROW_CAPACITY);
    const hiddenCount = expansion === 'collapsed' ? favorites.length - ROW_CAPACITY : 0;

    // only recompute the list
    const items = useMemo(() => {
        return favorites
            .map((item, index) => {
                return (
                    <TileMemo
                        url={item.url}
                        faviconSrc={item.favicon?.src}
                        faviconMax={item.favicon?.maxAvailableSize}
                        title={item.title}
                        key={item.id + item.favicon?.src + item.favicon?.maxAvailableSize}
                        id={item.id}
                        index={index}
                    />
                );
            })
            .concat(
                Array.from({ length: placeholders }).map((_, index) => {
                    if (index === 0) {
                        return <PlusIconMemo key="placeholder-plus" onClick={add} />;
                    }
                    return <Placeholder key={`placeholder-${index}`} />;
                }),
            );
    }, [favorites, placeholders, ITEM_PREFIX, add]);

    /**
     * @param {MouseEvent} event
     */
    function onContextMenu(event) {
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
    }
    /**
     * @param {MouseEvent} event
     */
    function onClick(event) {
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
    }

    const canToggleExpansion = items.length > ROW_CAPACITY;

    return (
        <div class={cn(styles.root, !canToggleExpansion && styles.bottomSpace)} data-testid="FavoritesConfigured">
            <div class={styles.grid} id={WIDGET_ID} ref={gridRef} onContextMenu={onContextMenu} onClick={onClick}>
                {items.slice(0, expansion === 'expanded' ? undefined : ROW_CAPACITY)}
            </div>
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
 * @param {number} totalItems
 * @param {number} itemsPerRow
 * @return {number|number}
 */
function calculatePlaceholders(totalItems, itemsPerRow) {
    if (totalItems === 0) return itemsPerRow;
    if (totalItems === itemsPerRow) return 1;
    // Calculate how many items are left over in the last row
    const itemsInLastRow = totalItems % itemsPerRow;

    // If there are leftover items, calculate the placeholders needed to fill the last row
    const placeholders = itemsInLastRow > 0 ? itemsPerRow - itemsInLastRow : 1;

    return placeholders;
}
