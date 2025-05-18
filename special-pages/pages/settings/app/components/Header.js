import styles from './Header.module.css';
import { h } from 'preact';
import { useComputed } from '@preact/signals';
import { SearchForm } from './SearchForm.js';
import { useQueryContext } from '../global/Providers/QueryProvider.js';

/**
 */
export function Header() {
    const search = useQueryContext();
    const term = useComputed(() => search.value.term);
    return (
        <div class={styles.root}>
            <div class={styles.controls}></div>
            <div class={styles.search}>
                <SearchForm term={term} />
            </div>
        </div>
    );
}
