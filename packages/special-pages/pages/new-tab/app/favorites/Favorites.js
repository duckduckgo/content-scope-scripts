import { h } from 'preact'
import { useVisibility } from '../widget-list/widget-config.provider.js'

export function FavoritesCustomized () {
    const { id, visibility } = useVisibility()
    if (visibility === 'hidden') {
        return null
    }
    return (
        <p>Favourites here... (id: <code>{id}</code>)</p>
    )
}
