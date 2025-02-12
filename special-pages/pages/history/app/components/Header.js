import styles from './Header.module.css';
import { h } from 'preact';
import { useComputed } from '@preact/signals';
import { SearchForm, useSearchContext } from './SearchForm.js';
import { Trash } from '../icons/Trash.js';
import { useTypedTranslation } from '../types.js';

/**
 */
export function Header() {
    const { t } = useTypedTranslation();
    const search = useSearchContext();
    const term = useComputed(() => search.value.term);
    return (
        <div class={styles.root}>
            <div class={styles.controls}>
                <button class={styles.largeButton} data-delete-all>
                    <span>{t('delete_all')}</span>
                    <Trash />
                </button>
            </div>
            <div class={styles.search}>
                <SearchForm term={term} />
            </div>
        </div>
    );
}
