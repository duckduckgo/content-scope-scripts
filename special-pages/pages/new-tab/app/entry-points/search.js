import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { Search } from '../search/components/Search.js';

export function factory() {
    return (
        <Centered data-entry-point="search">
            <Search />
        </Centered>
    );
}
