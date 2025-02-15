import styles from './Header.module.css';
import { h } from 'preact';
import { useTypedTranslation } from '../types.js';
import { useComputed } from '@preact/signals';
import { SearchIcon } from '../icons/Search.js';

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<string|null>} props.term
 * @param {import("@preact/signals").Signal<string|null>} props.domain
 */
export function SearchForm({ term, domain }) {
    const { t } = useTypedTranslation();
    const value = useComputed(() => term.value || domain.value || '');
    return (
        <form role="search">
            <label class={styles.label}>
                <span class="sr-only">{t('search_your_history')}</span>
                <span class={styles.searchIcon}>
                    <SearchIcon />
                </span>
                <input
                    class={styles.searchInput}
                    name="q"
                    autoCapitalize="off"
                    autoComplete="off"
                    type="search"
                    spellcheck={false}
                    autoFocus
                    placeholder={t('search')}
                    value={value}
                />
            </label>
        </form>
    );
}
