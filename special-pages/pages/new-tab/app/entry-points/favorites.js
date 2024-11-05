import { h } from 'preact'
import { FavoritesCustomized } from '../favorites/Favorites.js'
import { Centered } from '../components/Layout.js'

export function factory () {
    return (
        <Centered>
            <FavoritesCustomized/>
        </Centered>
    )
}
