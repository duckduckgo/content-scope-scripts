import { h } from 'preact'
import cn from 'classnames'

import { useVisibility } from '../widget-list/widget-config.provider.js'
import styles from './Favorites.module.css'
import { useContext, useId, useMemo, useCallback } from 'preact/hooks'
import { TileMemo } from './Tile.js'
import { FavoritesContext, FavoritesProvider } from './FavoritesProvider.js'
import { useGridState } from './FavouritesGrid.js'
import { memo } from 'preact/compat'
import { ChevronButton } from '../components/Icons.js'
import { useTypedTranslation } from '../types.js'
import { viewTransition } from '../utils.js'

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
 * @param {Expansion} props.expansion
 * @param {() => void} props.toggle
 * @param {Animation['kind']} [props.animation] - optionally configure animations
 */
export function Favorites (props) {
    if (props.animation === 'view-transitions') {
        return <WithViewTransitions {...props} />
    }

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
 * @param {Favorite[]} props.favorites
 * @param {import("preact").ComponentProps<Favorites>['listDidReOrder']} props.listDidReOrder
 * @param {Expansion} props.expansion
 * @param {() => void} props.toggle
 * @param {(id: string) => void} props.openContextMenu
 */
export function WithViewTransitions (props) {
    const willToggle = useCallback(() => {
        viewTransition(props.toggle)
    }, [props.toggle])
    return <FavoritesConfigured {...props} toggle={willToggle} animateItems={'view-transitions'} />
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
 */
export function FavoritesConfigured ({ gridRef, favorites, listDidReOrder, expansion, toggle, animateItems, openContextMenu }) {
    useGridState(favorites, listDidReOrder, animateItems)

    // todo: does this need to be dynamic for smaller screens?
    const ROW_CAPACITY = 6

    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId()
    const TOGGLE_ID = useId()

    const ITEM_PREFIX = useId()
    const placeholders = calculatePlaceholders(favorites.length, ROW_CAPACITY)

    // only recompute the list
    const items = useMemo(() => {
        return favorites.map((item) => (
            <TileMemo
                data={item.data}
                favicon={item.favicon}
                title={item.title}
                key={item.id}
                prefix={ITEM_PREFIX}
                id={item.id}
            />
        )).concat(Array.from({ length: placeholders }).map((_, index) => {
            if (index === 0) {
                return <PlusIcon key="placeholder-plus" />
            }
            return (
                <div key={`placeholder-${index}`} class={cn(styles.icon, styles.placeholder)} />
            )
        }))
    }, [favorites, placeholders, ITEM_PREFIX])

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

    return (
        <div class={styles.root}>
            <div
                class={styles.grid}
                id={WIDGET_ID}
                ref={gridRef}
                onContextMenu={onContextMenu}
            >
                {items.slice(0, expansion === 'expanded' ? undefined : ROW_CAPACITY)}
            </div>
            <ShowHide
                itemCount={items.length}
                expansion={expansion}
                toggle={toggle}
                capacity={ROW_CAPACITY}
                buttonAttrs={{
                    'aria-expanded': expansion === 'expanded',
                    'aria-pressed': expansion === 'expanded',
                    'aria-controls': WIDGET_ID,
                    id: TOGGLE_ID
                }}
            />
        </div>
    )
}

/**
 * Function to handle showing or hiding content based on certain conditions.
 *
 * @param {Object} props - Input parameters for controlling the behavior of the ShowHide functionality.
 * @param {number} props.itemCount - The current count of items to be displayed.
 * @param {string} props.expansion - The current state of expansion ('expanded' or 'collapsed').
 * @param {() => void} props.toggle - Callback function to toggle the display state.
 * @param {number} props.capacity - The maximum capacity for items to be displayed before hiding.
 * @param {import("preact").ComponentProps<'button'>} [props.buttonAttrs] - The maximum capacity for items to be displayed before hiding.
 */
function ShowHide ({ itemCount, expansion, toggle, capacity, buttonAttrs = {} }) {
    const { t } = useTypedTranslation()
    return (
        <div
            className={cn({
                [styles.showhide]: true,
                [styles.showhideVisible]: itemCount > capacity
            })}
        >
            <button
                {...buttonAttrs}
                className={styles.showhideButton}
                aria-label={expansion === 'expanded'
                    ? t('favorites_show_less')
                    : t('favorites_show_more')
                }
                onClick={toggle}>
                <ChevronButton />
            </button>
        </div>
    )
}

const PlusIcon = memo(function PlusIcon () {
    const labelId = useId()
    return (
        <div class={styles.item}>
            <button class={cn(styles.icon, styles.placeholder, styles.plus)} aria-labelledby={labelId}>
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
})

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
    const placeholders = itemsInLastRow > 0 ? itemsPerRow - itemsInLastRow : 0

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
    const { state, toggle, listDidReOrder, openContextMenu } = useContext(FavoritesContext)
    if (state.status === 'ready') {
        return (
            <Favorites
                favorites={state.data.favorites}
                expansion={state.config.expansion}
                animation={state.config.animation?.kind}
                listDidReOrder={listDidReOrder}
                openContextMenu={openContextMenu}
                toggle={toggle}
            />
        )
    }
    return null
}
