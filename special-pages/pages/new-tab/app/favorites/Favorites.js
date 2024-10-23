import { h } from 'preact'
import { useVisibility } from '../widget-list/widget-config.provider.js'
import { useTypedTranslation } from '../types.js'
import { useCustomizer } from '../customizer/Customizer.js'

export function FavoritesCustomized () {
    const { t } = useTypedTranslation()
    const { id, visibility } = useVisibility()

    // register with the visibility menu
    const title = t('favorites_menu_title')
    useCustomizer({ title, id, icon: 'shield' })

    if (visibility === 'hidden') {
        return null
    }
    return (
        <p>Favourites here... (id: <code>{id}</code>)</p>
    )
}
