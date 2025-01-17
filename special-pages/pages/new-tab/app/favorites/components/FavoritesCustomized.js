import { h } from 'preact';
import { useContext } from 'preact/hooks';

import { useTelemetry, useTypedTranslationWith } from '../../types.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';

import { FavoritesContext, FavoritesProvider } from './FavoritesProvider.js';
import { PragmaticDND } from './PragmaticDND.js';
import { FavoritesMemo } from './Favorites.js';

/**
 * Component that consumes FavoritesContext for displaying favorites list.
 */
export function FavoritesConsumer() {
    const { state, toggle, favoritesDidReOrder, openContextMenu, openFavorite, add } = useContext(FavoritesContext);
    const telemetry = useTelemetry();

    if (state.status === 'ready') {
        telemetry.measureFromPageLoad('favorites-will-render', 'time to favorites');
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
    const { t } = useTypedTranslationWith(/** @type {import("../strings.json")} */ ({}));
    const { id, visibility, toggle, index } = useVisibility();

    // register with the visibility menu
    const title = t('favorites_menu_title');
    useCustomizer({ title, id, icon: 'star', toggle, visibility: visibility.value, index });

    if (visibility.value === 'hidden') {
        return null;
    }
    return (
        <FavoritesProvider>
            <FavoritesConsumer />
        </FavoritesProvider>
    );
}
