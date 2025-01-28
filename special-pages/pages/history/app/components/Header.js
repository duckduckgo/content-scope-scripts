import styles from './Header.module.css';
import { Fire } from '../icons/Fire.js';
import { h } from 'preact';
import { useMessaging, useTypedTranslation } from '../types.js';
import { Cross } from '../icons/Cross.js';
import { useEffect } from 'preact/hooks';

export function Header({ setResults }) {
    const { t } = useTypedTranslation();
    const historyPage = useMessaging();
    useEffect(() => {
        historyPage
            .query({ term: '', limit: 150, offset: 0 })
            // eslint-disable-next-line promise/prefer-await-to-then
            .then(setResults)
            // eslint-disable-next-line promise/prefer-await-to-then
            .catch((e) => {
                console.log('did catch...', e);
            });
    }, []);
    return (
        <div class={styles.root}>
            <div class={styles.controls}>
                <button class={styles.largeButton}>
                    <Fire />
                    <span>Clear History and Data...</span>
                </button>
                <button class={styles.largeButton}>
                    <Cross />
                    <span>Remove History...</span>
                </button>
            </div>
            <div class={styles.search}>
                <form
                    action=""
                    onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(/** @type {HTMLFormElement} */ (e.target));
                        historyPage
                            .query({ term: data.get('term')?.toString() || '', limit: 150, offset: 0 })
                            // eslint-disable-next-line promise/prefer-await-to-then
                            .then(setResults)
                            // eslint-disable-next-line promise/prefer-await-to-then
                            .catch((e) => {
                                console.log('did catch...', e);
                            });
                    }}
                >
                    <input type="search" placeholder={t('search')} class={styles.searchInput} name="term" />
                </form>
            </div>
        </div>
    );
}
