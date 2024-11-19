import { h } from 'preact';
import { useContext } from 'preact/hooks';

import { useTypedTranslation } from '../../types.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { useCustomizer } from '../../customizer/Customizer.js';

import { FavoritesContext, FavoritesProvider } from './FavoritesProvider.js';
import { PragmaticDND } from './PragmaticDND.js';
import { FavoritesMemo } from './Favorites.js';

/**
 * Component that consumes FavoritesContext for displaying favorites list.
 */
export function FavoritesConsumer() {
    const { state, toggle, favoritesDidReOrder, openContextMenu, openFavorite, add } = useContext(FavoritesContext);

    if (state.status === 'ready') {
        return (
            <PragmaticDND items={state.data.favorites} itemsDidReOrder={favoritesDidReOrder}>
                <FavoritesMemo
                    favorites={state.data.favorites}
                    expansion={state.config.expansion}
                    openContextMenu={openContextMenu}
                    openFavorite={openFavorite}
                    add={add}
                    toggle={toggle}
                />
            </PragmaticDND>
        );
    }
    return null;
}

/**
 * Render the favorites widget, with integration into the page customizer
 */
export function FavoritesCustomized() {
    const { t } = useTypedTranslation();
    const { id, visibility, toggle, index } = useVisibility();

    // register with the visibility menu
    const title = t('favorites_menu_title');
    useCustomizer({ title, id, icon: 'star', toggle, visibility, index });

    if (visibility === 'hidden') {
        return null;
    }
    return (
        <FavoritesProvider>
            <FavoritesConsumer />
        </FavoritesProvider>
    );
}
