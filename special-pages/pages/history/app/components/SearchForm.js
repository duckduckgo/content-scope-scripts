import styles from './Header.module.css';
import { h } from 'preact';
import { useTypedTranslation } from '../types.js';

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<string|null>} props.term
 */
export function SearchForm({ term }) {
    const { t } = useTypedTranslation();
    // const onInput = (event) => (term.value = event.currentTarget.value);
    return (
        <form role="search">
            <label>
                <span class="sr-only">{t('search_your_history')}</span>
                <input type="search" placeholder={t('search')} class={styles.searchInput} name="q" value={term.value || ''} />
            </label>
        </form>
    );
}
