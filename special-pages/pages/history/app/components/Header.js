import styles from './Header.module.css';
import { h } from 'preact';
import { useComputed } from '@preact/signals';
import { SearchForm } from './SearchForm.js';
import { Trash } from '../icons/Trash.js';
import { useTypedTranslation } from '../types.js';
import { useQueryContext } from '../global-state/QueryProvider.js';
import { BTN_ACTION_DELETE_ALL } from '../constants.js';
import { useGlobalState } from '../global-state/GlobalStateProvider.js';
import { useSelected } from '../global-state/SelectionProvider.js';

/**
 */
export function Header() {
    const search = useQueryContext();
    const term = useComputed(() => search.value.term);
    const domain = useComputed(() => search.value.domain);
    return (
        <div class={styles.root}>
            <Controls term={term} />
            <div class={styles.search}>
                <SearchForm term={term} domain={domain} />
            </div>
        </div>
    );
}

/**
 * Renders the Controls component that displays a button for deletion functionality.
 *
 * @param {Object} props - Properties passed to the component.
 * @param {import("@preact/signals").Signal<string|null>} props.term
 */
function Controls({ term }) {
    const { t } = useTypedTranslation();
    const selected = useSelected();
    const buttonTxt = useComputed(() => {
        const hasTerm = term.value !== null && term.value.trim() !== '';
        const hasSelections = selected.value.size > 0;
        return hasTerm || hasSelections ? t('delete_some') : t('delete_all');
    });
    const { results } = useGlobalState();
    const ariaDisabled = useComputed(() => (results.value.items.length === 0 ? 'true' : 'false'));
    const title = useComputed(() => (results.value.items.length === 0 ? t('delete_none') : ''));
    return (
        <div class={styles.controls}>
            <button class={styles.largeButton} data-action={BTN_ACTION_DELETE_ALL} aria-disabled={ariaDisabled} title={title}>
                <span>{buttonTxt}</span>
                <Trash />
            </button>
        </div>
    );
}
