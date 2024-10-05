import { h } from 'preact'
import cn from 'classnames'
import { useVisibility } from '../widget-list/widget-config.provider.js'
import styles from './Favorites.module.css'
import { useCallback, useContext } from 'preact/hooks'
import { TileMemo } from './Tile.js'
import { FavoritesContext, FavoritesDispatchContext, FavoritesProvider } from './FavoritesProvider.js'
import { useGridState } from './FavouritesGrid.js'
import { memo } from 'preact/compat'
import { Chevron } from '../components/Chevron.js'
import { useTypedTranslation } from '../types.js'
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js'

/**
 * @typedef {import('../../../../types/new-tab').Expansion} Expansion
 * @typedef {import('../../../../types/new-tab').Favorite} Favorite
 * @typedef {import('../../../../types/new-tab').FavoritesData} FavoritesData
 * @typedef {import('../../../../types/new-tab').FavoritesConfig} FavoritesConfig
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const states = /** @type {const} */([
    // in this instance, there's more to see if the user wishes to do so
    // for example, capacity is 6. user has 6 favorites, and the additional `+` icon makes us over limit
    'collapsed_over_capacity',

    // in this instance, there's nothing more to show
    // for example; the user has 5 favorites; the 6th item is the '+' button, meaning we have nothing to show
    'collapsed_within_capacity',

    // if expanded + over capacity (eg: anything over 6)
    // for example, the user has 10 favorites - everything will be shown, but we can allow it to become collapsed
    'expanded_over_capacity',

    // we can be 'expanded', but not have enough elements to allow it to become collapsed,
    // for example, we could technically be 'expanded' but only have a single favorite
    'expanded_within_capacity'
])

/**
 * @typedef {states[number]} ShowHideState
 */

/**
 * @param {object} props
 * @param {Favorite[]} props.favorites
 * @param {(list: Favorite[]) => void} props.listDidReOrder
 * @param {Expansion} props.expansion
 * @param {() => void} props.toggle
 */
export function Favorites ({ favorites, listDidReOrder, expansion, toggle }) {
    useGridState(favorites, listDidReOrder)
    const { isReducedMotion } = useEnv()
    const placeholders = calculatePlaceholders(favorites.length, 6)
    const total = favorites.length + placeholders

    const items = favorites.map((item) => (
        <TileMemo
            data={item.data}
            favicon={item.favicon}
            title={item.title}
            key={item.id}
            id={item.id}
        />
    )).concat(Array.from({ length: placeholders }).map((_, index) => {
        if (index === 0) {
            return <PlusIcon key={`placeholder-${index}`}/>
        }
        return (
            <div key={`placeholder-${index}`} class={cn(styles.icon, styles.placeholder)}/>
        )
    }))

    const onToggle = useCallback(() => {
        if (isReducedMotion) {
            return toggle()
        }

        if ('startViewTransition' in document && typeof document.startViewTransition === 'function') {
            return document.startViewTransition(toggle)
        }

        toggle()
    }, [isReducedMotion])

    return (
        <div class={styles.root}>
            <div class={styles.grid}>
                {items.slice(0, expansion === 'expanded' ? undefined : 6)}
            </div>
            <ShowHide total={total} expansion={expansion} toggle={onToggle} />
        </div>
    )
}

function ShowHide ({ total, expansion, toggle }) {
    const { t } = useTypedTranslation()
    /** @type {ShowHideState} */
    let state
    if (expansion === 'expanded') {
        if (total > 6) {
            state = 'expanded_over_capacity'
        } else {
            state = 'expanded_within_capacity'
        }
    } else {
        if (total > 6) {
            state = 'collapsed_over_capacity'
        } else {
            state = 'collapsed_within_capacity'
        }
    }
    return (
        <div className={cn({
            [styles.showhide]: true,
            [styles.showhideVisible]: state === 'collapsed_over_capacity' || state === 'expanded_over_capacity'
        })}>
            <div className={styles.showhideInner}>
                <hr className={styles.hr}/>
                <button
                    className={styles.showhideButton}
                    aria-pressed={expansion === 'expanded'}
                    onClick={toggle}>
                    {expansion === 'expanded' && t('favorites_show_less')}
                    {expansion === 'collapsed' && t('favorites_show_more')}
                    <Chevron/>
                </button>
            </div>
        </div>
    )
}

const PlusIcon = memo(function PlusIcon () {
    return (
        <div className={styles.item}>
            <div className={cn(styles.icon, styles.placeholder, styles.plus)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <g opacity="0.8">
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M8.25 0.5C8.66421 0.5 9 0.835786 9 1.25V7H14.75C15.1642 7 15.5 7.33579 15.5 7.75C15.5 8.16421 15.1642 8.5 14.75 8.5H9V14.25C9 14.6642 8.66421 15 8.25 15C7.83579 15 7.5 14.6642 7.5 14.25V8.5H1.75C1.33579 8.5 1 8.16421 1 7.75C1 7.33579 1.33579 7 1.75 7H7.5V1.25C7.5 0.835786 7.83579 0.5 8.25 0.5Z"
                            fill="currentColor"
                            fill-opacity="0.9"
                        />
                    </g>
                </svg>
            </div>
            <div className={styles.text}>
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
            <FavoritesConsumer/>
        </FavoritesProvider>
    )
}

export function FavoritesConsumer () {
    const { state, toggle, listDidReOrder } = useContext(FavoritesContext)
    if (state.status === 'ready') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const send = useContext(FavoritesDispatchContext)
        return (
            <Favorites
                favorites={state.data.favorites}
                expansion={state.config.expansion}
                listDidReOrder={listDidReOrder}
                toggle={toggle}
            />
        )
    }
    return null
}
