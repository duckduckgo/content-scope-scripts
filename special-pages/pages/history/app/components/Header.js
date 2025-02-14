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
    const { t } = useTypedTranslation();
    const search = useQueryContext();
    const { results } = useGlobalState();

    const ariaDisabled = useComputed(() => (results.value.items.length === 0 ? 'true' : 'false'));
    const title = useComputed(() => (results.value.items.length === 0 ? t('delete_none') : ''));
    const term = useComputed(() => search.value.term);
    return (
        <div class={styles.root}>
            <Controls ariaDisabled={ariaDisabled} title={title} />
            <div class={styles.search}>
                <SearchForm term={term} />
            </div>
        </div>
    );
}

function Controls(props) {
    const { t } = useTypedTranslation();
    const selected = useSelected();
    const buttonTxt = useComputed(() => {
        return selected.value.size > 0 ? t('delete_some') : t('delete_all');
    });
    return (
        <div class={styles.controls}>
            <button class={styles.largeButton} data-action={BTN_ACTION_DELETE_ALL} aria-disabled={props.ariaDisabled} title={props.title}>
                <span>{buttonTxt}</span>
                <Trash />
            </button>
        </div>
    );
}
