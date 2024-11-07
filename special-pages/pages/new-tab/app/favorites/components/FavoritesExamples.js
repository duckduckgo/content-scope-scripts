import { h } from 'preact';

import { noop } from '../../utils.js';
import { favorites } from '../mocks/favorites.data.js';
import { FavoritesMemo } from './Favorites.js';

export const favoritesExamples = {
    'favorites.no-dnd': {
        factory: () => (
            <FavoritesMemo
                favorites={favorites.many.favorites}
                expansion={'expanded'}
                toggle={noop('toggle')}
                add={noop('add')}
                openFavorite={noop('openFavorite')}
                openContextMenu={noop('openContextMenu')}
            />
        ),
    },
};
