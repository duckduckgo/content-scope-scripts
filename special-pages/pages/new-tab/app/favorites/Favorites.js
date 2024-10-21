import { h } from 'preact'
import cn from 'classnames'

import { useVisibility } from '../widget-list/widget-config.provider.js'
import styles from './Favorites.module.css'
import { useContext, useId, useMemo } from 'preact/hooks'
import { TileMemo } from './Tile.js'
import { FavoritesContext, FavoritesProvider } from './FavoritesProvider.js'
import { useGridState } from './FavouritesGrid.js'
import { memo } from 'preact/compat'
import { useTypedTranslation } from '../types.js'
import { ShowHideButton } from '../components/ShowHideButton.jsx'

/**
 * @typedef {import('../../../../types/new-tab').Expansion} Expansion
 * @typedef {import('../../../../types/new-tab').Animation} Animation
 * @typedef {import('../../../../types/new-tab').Favorite} Favorite
 * @typedef {import('../../../../types/new-tab').FavoritesData} FavoritesData
 * @typedef {import('../../../../types/new-tab').FavoritesConfig} FavoritesConfig
 */

/**
 * @param {object} props
 * @param {Favorite[]} props.favorites
 * @param {(list: Favorite[], id: string, toIndex: number) => void} props.listDidReOrder
 * @param {(id: string) => void} props.openContextMenu
 * @param {() => void} props.add
 * @param {Expansion} props.expansion
 * @param {() => void} props.toggle
 */
export function Favorites (props) {
    // no animations
    return (
        <FavoritesConfigured
            {...props}
            animateItems={'none'}
        />
    )
}

/**
 * @param {object} props
 * @param {import("preact").Ref<any>} [props.gridRef]
 * @param {Favorite[]} props.favorites
 * @param {import("preact").ComponentProps<Favorites>['listDidReOrder']} props.listDidReOrder
 * @param {Expansion} props.expansion
 * @param {Animation['kind']} props.animateItems
 * @param {() => void} props.toggle
 * @param {(id: string) => void} props.openContextMenu
 * @param {() => void} props.add
 */
export function FavoritesConfigured ({ gridRef, favorites, listDidReOrder, expansion, toggle, animateItems, openContextMenu, add }) {
    useGridState(favorites, listDidReOrder, animateItems)
    const { t } = useTypedTranslation()

    // todo: does this need to be dynamic for smaller screens?
    const ROW_CAPACITY = 6

    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId()
    const TOGGLE_ID = useId()

    const ITEM_PREFIX = useId()
    const placeholders = calculatePlaceholders(favorites.length, ROW_CAPACITY)
    const hiddenCount = expansion === 'collapsed'
        ? favorites.length - ROW_CAPACITY
        : 0

    // only recompute the list
    const items = useMemo(() => {
        return favorites.map((item, index) => {
            return (
                <TileMemo
                    data={item.data}
                    favicon={item.favicon}
                    title={item.title}
                    key={item.id}
                    id={item.id}
                    index={index}
                    visible={true}
                />
            )
        }).concat(Array.from({ length: placeholders }).map((_, index) => {
            if (index === 0) {
                return <PlusIconMemo key="placeholder-plus" onClick={add} />
            }
            return (
                <div key={`placeholder-${index}`} class={cn(styles.icon, styles.placeholder)} />
            )
        }))
    }, [favorites, placeholders, ITEM_PREFIX, add])

    /**
     * @param {MouseEvent} event
     */
    function onContextMenu (event) {
        let target = /** @type {HTMLElement|null} */(event.target)
        while (target && target !== event.currentTarget) {
            if (typeof target.dataset.id === 'string') {
                event.preventDefault()
                event.stopImmediatePropagation()
                return openContextMenu(target.dataset.id)
            } else {
                target = target.parentElement
            }
        }
    }

    const canToggleExpansion = items.length > ROW_CAPACITY

    return (
        <div class={styles.root} data-testid="FavoritesConfigured">
            <div
                class={styles.grid}
                id={WIDGET_ID}
                ref={gridRef}
                onContextMenu={onContextMenu}
            >
                {items.slice(0, expansion === 'expanded' ? undefined : ROW_CAPACITY)}
            </div>
            <div
                className={cn({
                    [styles.showhide]: true,
                    [styles.showhideVisible]: canToggleExpansion
                })}
            >
                {canToggleExpansion && (
                    <ShowHideButton
                        buttonAttrs={{
                            'aria-expanded': expansion === 'expanded',
                            'aria-pressed': expansion === 'expanded',
                            'aria-controls': WIDGET_ID,
                            id: TOGGLE_ID
                        }}
                        text={expansion === 'expanded'
                            ? t('favorites_show_less')
                            : t('favorites_show_more', { count: String(hiddenCount) })}
                        onClick={toggle}
                    />
                )}
            </div>
        </div>
    )
}

/**
 * @param {object} props
 * @param {() => void} props.onClick
 */
function PlusIcon ({ onClick }) {
    const labelId = useId()
    return (
        <div class={styles.item}>
            <button
                class={cn(styles.icon, styles.placeholder, styles.plus)}
                aria-labelledby={labelId}
                onClick={onClick}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M8.25 0.5C8.66421 0.5 9 0.835786 9 1.25V7H14.75C15.1642 7 15.5 7.33579 15.5 7.75C15.5 8.16421 15.1642 8.5 14.75 8.5H9V14.25C9 14.6642 8.66421 15 8.25 15C7.83579 15 7.5 14.6642 7.5 14.25V8.5H1.75C1.33579 8.5 1 8.16421 1 7.75C1 7.33579 1.33579 7 1.75 7H7.5V1.25C7.5 0.835786 7.83579 0.5 8.25 0.5Z"
                        fill="currentColor"
                    />
                </svg>
            </button>
            <div class={styles.text} id={labelId}>
                {'Add Favorite'}
            </div>
        </div>
    )
}

const PlusIconMemo = memo(PlusIcon)

/**
 * @param {number} totalItems
 * @param {number} itemsPerRow
 * @return {number|number}
 */
function calculatePlaceholders (totalItems, itemsPerRow) {
    if (totalItems === 0) return itemsPerRow
    if (totalItems === itemsPerRow) return 1
    // Calculate how many items are left over in the last row
    const itemsInLastRow = totalItems % itemsPerRow

    // If there are leftover items, calculate the placeholders needed to fill the last row
    const placeholders = itemsInLastRow > 0 ? itemsPerRow - itemsInLastRow : 1

    return placeholders
}

export function FavoritesCustomized () {
    const { visibility } = useVisibility()
    if (visibility === 'hidden') {
        return null
    }
    return (
        <FavoritesProvider>
            <FavoritesConsumer />
        </FavoritesProvider>
    )
}

/**
 * Component that consumes FavoritesContext for displaying favorites list.
 */
export function FavoritesConsumer () {
    const { state, toggle, listDidReOrder, openContextMenu, add } = useContext(FavoritesContext)
    if (state.status === 'ready') {
        return (
            <Favorites
                favorites={state.data.favorites}
                expansion={state.config.expansion}
                listDidReOrder={listDidReOrder}
                openContextMenu={openContextMenu}
                add={add}
                toggle={toggle}
            />
        )
    }
    return null
}
