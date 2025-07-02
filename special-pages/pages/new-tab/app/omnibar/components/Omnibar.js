import { h } from 'preact';
import { useState } from 'preact/hooks';
import { AiChatIcon, SearchIcon } from '../../components/Icons.js';
import { useTypedTranslationWith } from '../../types';
import { viewTransition } from '../../utils';
import { AiChatForm } from './AiChatForm';
import styles from './Omnibar.module.css';
import { SearchForm } from './SearchForm';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 * @typedef {import('../../../types/new-tab.js').SuggestionsData} SuggestionsData
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {OmnibarConfig['mode']} props.mode
 * @param {(mode: OmnibarConfig['mode']) => void} props.setMode
 * @param {(term: string) => Promise<SuggestionsData>} props.getSuggestions
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.openSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.submitSearch
 * @param {(params: {chat: string, target: OpenTarget}) => void} props.submitChat
 */
export function Omnibar({ mode, setMode, getSuggestions, openSuggestion, submitSearch, submitChat }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const [query, setQuery] = useState(/** @type {String} */ (''));

    return (
        <div class={styles.root} data-mode={mode}>
            <div class={styles.logoWrap}>
                <img src="./icons/Logo-Stacked.svg" alt="DuckDuckGo" width={144} height={115.9} />
            </div>
            <div class={styles.tabListWrap}>
                <div class={styles.tabList} role="tablist" aria-label="Search & Duck.ai tab switcher">
                    <button
                        class={styles.tab}
                        role="tab"
                        aria-selected={mode === 'search'}
                        onClick={() => {
                            viewTransition(() => {
                                setMode('search');
                            });
                        }}
                    >
                        <SearchIcon className={styles.searchIcon} />
                        Search
                    </button>
                    <button
                        class={styles.tab}
                        role="tab"
                        aria-selected={mode === 'ai'}
                        onClick={() => {
                            viewTransition(() => {
                                setMode('ai');
                            });
                        }}
                    >
                        <AiChatIcon className={styles.aiChatIcon} />
                        Duck.ai
                    </button>
                </div>
            </div>
            {mode === 'search' ? (
                <SearchForm
                    term={query}
                    setTerm={setQuery}
                    getSuggestions={getSuggestions}
                    openSuggestion={openSuggestion}
                    submitSearch={submitSearch}
                />
            ) : (
                <AiChatForm chat={query} setChat={setQuery} submitChat={submitChat} />
            )}
        </div>
    );
}
