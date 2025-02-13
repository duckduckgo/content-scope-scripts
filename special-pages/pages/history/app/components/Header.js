import styles from './Header.module.css';
import { h } from 'preact';
import { useComputed } from '@preact/signals';
import { SearchForm } from './SearchForm.js';
import { Trash } from '../icons/Trash.js';
import { useTypedTranslation } from '../types.js';
import { useQueryContext } from '../global-state/QueryProvider.js';
import { BTN_ACTION_DELETE_ALL } from '../constants.js';

/**
 */
export function Header() {
    const { t } = useTypedTranslation();
    const search = useQueryContext();
    const term = useComputed(() => search.value.term);
    return (
        <div class={styles.root}>
            <div class={styles.controls}>
                <button class={styles.largeButton} data-action={BTN_ACTION_DELETE_ALL}>
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
