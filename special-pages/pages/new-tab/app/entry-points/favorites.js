import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { FavoritesCustomized } from '../favorites/components/FavoritesCustomized.js';

export function factory() {
    return (
        <Centered>
            <FavoritesCustomized />
        </Centered>
    );
}
