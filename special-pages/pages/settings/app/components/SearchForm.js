import styles from './Header.module.css';
import { h } from 'preact';
import { usePlatformName, useTypedTranslation } from '../types.js';
import { useComputed, useSignalEffect } from '@preact/signals';
import { SearchIcon } from '../icons/Search.js';
import { useQueryDispatch } from '../global/Providers/QueryProvider.js';
import { useNavDispatch } from '../global/Providers/NavProvider.js';
import { useDefaultScreen } from '../global/Providers/SettingsServiceProvider.js';

const INPUT_FIELD_NAME = 'search';

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<string|null>} props.term
 */
export function SearchForm({ term }) {
    const { t } = useTypedTranslation();
    const value = useComputed(() => term.value || '');
    const dispatch = useQueryDispatch();
    const navDispatch = useNavDispatch();
    const platformName = usePlatformName();
    useSearchShortcut(platformName);

    /**
     * @param {InputEvent} inputEvent
     */
    function input(inputEvent) {
        invariant(inputEvent.target instanceof HTMLInputElement);
        invariant(inputEvent.target.form instanceof HTMLFormElement);
        const data = new FormData(inputEvent.target.form);
        const term = data.get(INPUT_FIELD_NAME)?.toString();
        invariant(term !== undefined);
        dispatch({ kind: 'search-by-term', value: term });
        navDispatch({ kind: 'search', term });
    }

    /**
     * @param {SubmitEvent} submitEvent
     */
    function submit(submitEvent) {
        submitEvent.preventDefault();
        invariant(submitEvent.currentTarget instanceof HTMLFormElement);
        const data = new FormData(submitEvent.currentTarget);
        const term = data.get(INPUT_FIELD_NAME)?.toString();
        dispatch({ kind: 'search-by-term', value: term ?? '' });
        navDispatch({ kind: 'search', term: term ?? '' });
    }

    return (
        <form role="search" class={styles.form} onSubmit={submit}>
            <label class={styles.label}>
                <span class="sr-only">{t('search_settings')}</span>
                <span class={styles.searchIcon}>
                    <SearchIcon />
                </span>
                <input
                    class={styles.searchInput}
                    name={INPUT_FIELD_NAME}
                    autoCapitalize="off"
                    autoComplete="off"
                    type="search"
                    spellcheck={false}
                    placeholder={t('search')}
                    value={value}
                    onInput={input}
                />
            </label>
        </form>
    );
}

/**
 * Listens for keyboard shortcuts to focus the search input.
 *
 * Handles platform-specific shortcuts for MacOS (Cmd+F) and Windows (Ctrl+F).
 * If the shortcut is triggered, it will prevent the default action and focus
 * on the first `input[type="search"]` element in the DOM, if available.
 *
 * @param {'macos' | 'windows'} platformName - Defines the current platform to handle the appropriate shortcut.
 */
function useSearchShortcut(platformName) {
    useSignalEffect(() => {
        const keydown = (e) => {
            const isMacOS = platformName === 'macos';
            const isFindShortcutMacOS = isMacOS && e.metaKey && e.key === 'f';
            const isFindShortcutWindows = !isMacOS && e.ctrlKey && e.key === 'f';

            if (isFindShortcutMacOS || isFindShortcutWindows) {
                e.preventDefault();
                const searchInput = /** @type {HTMLInputElement|null} */ (document.querySelector(`input[type="search"]`));
                if (searchInput) {
                    searchInput.focus();
                }
            }
        };
        document.addEventListener('keydown', keydown);
        return () => {
            document.removeEventListener('keydown', keydown);
        };
    });
}

/**
 * @param {any} condition
 * @param {string} [message]
 * @return {asserts condition}
 */
export function invariant(condition, message) {
    if (condition) return;
    if (message) throw new Error('Invariant failed: ' + message);
    throw new Error('Invariant failed');
}
