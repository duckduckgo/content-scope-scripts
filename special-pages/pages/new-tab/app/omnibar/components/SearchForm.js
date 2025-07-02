import { h } from 'preact';
import cn from 'classnames';
import styles from './Omnibar.module.css';
import { SuggestionList } from './SuggestionList.js';
import { AiChatIcon, SearchIcon } from '../../components/Icons.js';
import { useSuggestions } from './useSuggestions';
import { useEffect, useRef } from 'preact/hooks';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 * @typedef {import('../../../types/new-tab.js').SuggestionsData} SuggestionsData
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 * @typedef {import('./useSuggestions').FancyValue} FancyValue
 */

/**
 * @param {object} props
 * @param {string} props.term
 * @param {(term: string) => void} props.setTerm
 * @param {(term: string) => Promise<SuggestionsData>} props.getSuggestions
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.openSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.submitSearch
 */
export function SearchForm({ term, setTerm, getSuggestions, openSuggestion, submitSearch }) {
    const { value, items, selectedItem, onChange, onKeyDown, setSelection, clearSelection } = useSuggestions({
        term,
        setTerm,
        getSuggestions,
        openSuggestion,
    });

    /** @type {(event: SubmitEvent) => void} */
    const onSubmit = (event) => {
        event.preventDefault();
        if (!(event.target instanceof HTMLFormElement)) return;
        const formData = new FormData(event.target);
        const term = formData.get('term')?.toString() ?? '';
        submitSearch({
            term,
            target: 'same-tab',
        });
    };

    return (
        <div class={styles.formWrap}>
            <form onSubmit={onSubmit} class={styles.form}>
                <div class={styles.inputRoot} style={{ viewTransitionName: 'omnibar-input-transition' }}>
                    <div class={styles.inputContainer} style={{ viewTransitionName: 'omnibar-input-transition2' }}>
                        <InputWithCompletion
                            type="text"
                            role="combobox"
                            name="term"
                            class={styles.input}
                            placeholder="Search or enter address"
                            aria-label="Search or enter address"
                            aria-expanded="true"
                            aria-haspopup="listbox"
                            aria-controls="search-suggestions"
                            aria-activedescendant={selectedItem?.id}
                            spellcheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            value={value}
                            onChange={onChange}
                            onKeyDown={onKeyDown}
                        />
                        <div class={styles.inputActions}>
                            <button class={cn(styles.inputAction)} aria-label="Web search" inert>
                                <SearchIcon />
                            </button>
                            <div class={styles.separator}></div>
                            <button class={cn(styles.inputAction, styles.squareButton)} aria-label="Duck.ai" type="button">
                                <AiChatIcon className={styles.aiChatIcon} />
                            </button>
                        </div>
                    </div>
                </div>
                <SuggestionList items={items} setSelection={setSelection} clearSelection={clearSelection} openSuggestion={openSuggestion} />
            </form>
        </div>
    );
}

/**
 * @param {Omit<import('preact').JSX.InputHTMLAttributes, 'value'> & { value: FancyValue }} props
 * @returns
 */
function InputWithCompletion({ value, ...props }) {
    const ref = useRef(/** @type {HTMLInputElement|null} */ (null));

    useEffect(() => {
        if (!ref.current) return;
        if ('caret' in value) {
            ref.current.value = value.value;
            ref.current.setSelectionRange(value.caret, value.caret);
        } else if ('completion' in value) {
            ref.current.value = value.value + value.completion;
            ref.current.setSelectionRange(value.value.length, value.value.length + value.completion.length);
        } else {
            ref.current.value = value.value;
            // ref.current.setSelectionRange(value.value.length, value.value.length);
        }
    }, [value]);

    return <input {...props} ref={ref} />;
}
