import { h } from 'preact'
import styles from './Favourites.module.css'
import { ShowHide } from './ShowHide'
import { favorites } from '../data'
import { useCustomizer } from '../hooks/useCustomizer'
import { useContext } from 'preact/hooks'
import { VisibilityContext } from '../providers/visibility.provider.js'
import { useTranslation } from '../hooks/use-translation'

export function Favorites () {
    const { visibility, toggle } = useContext(VisibilityContext)
    const { translate } = useTranslation()

    useCustomizer({
        visibility,
        toggle: () => {
            toggle()
        },
        data: {
            id: 'favorites',
            title: translate('FAVORITES_MENU_TITLE'),
            icon: 'shield',
            desc: translate('FAVORITES_INFO_TT_LABEL'),
            order: 1
        }
    })

    return (
        <div hidden={visibility === 'hidden'}>
            <FavoritesInner />
        </div>
    )
}

export function FavoritesInner () {
    const items = favorites.slice(0, 8)
    const maxPerRow = 6
    const totalItems = items.length + 1 // items plus the add button
    const rows = Math.ceil(totalItems / maxPerRow)
    const placeholdersNeeded = rows * maxPerRow - totalItems
    const placeholders = new Array(placeholdersNeeded).fill(null)

    return (
        <div class={styles.favorites}>
            <ul class={styles.list}>
                {items.map((item, index) => {
                    return (
                        <li key={index} class={styles.listItem} data-id={item.id}>
                            <a href={item.href} class={styles.link}>
                                <span class={[styles.icon, styles.favorite].join(' ')}>
                                    <img src={item.favicon} class={styles.img} alt="" />
                                </span>
                                <span class={styles.title}>{item.title}</span>
                            </a>
                        </li>
                    )
                })}
                <li class={styles.listItem}>
                    <button class={styles.link} type="button">
                        <span class={[styles.icon, styles.plus].join(' ')}>
                            <PlusIcon />
                        </span>
                        <span class={styles.title}>Add Favorite</span>
                    </button>
                </li>
                {placeholders.map((item, index) => {
                    return (
                        <li className={styles.listItem} key={'placeholder' + index}>
                            <div className={styles.placeholder}>
                                <span className={[styles.icon, styles.empty].join(' ')}></span>
                            </div>
                        </li>
                    )
                })}
            </ul>
            <ShowHide />
        </div>
    )
}

function PlusIcon () {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class={styles.img}
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    )
}
