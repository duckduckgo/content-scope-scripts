import { useState } from 'preact/hooks';
import { h, Fragment } from 'preact';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../types.js';
import styles from './Omnibox.module.css';
import { SuggestionList } from './SuggestionList.js';
import { AiChatIcon, ArrowRightIcon, SearchIcon } from '../../components/Icons.js';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmniboxConfig} OmniboxConfig
 * @typedef {import('../../../types/new-tab.js').SuggestionsData} SuggestionsData
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {OmniboxConfig['mode']} props.mode
 * @param {(mode: OmniboxConfig['mode']) => void} props.setMode
 * @param {(term: string) => Promise<SuggestionsData>} props.getSuggestions
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.openSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.submitSearch
 * @param {(params: {chat: string, target: OpenTarget}) => void} props.submitChat
 */
export function Omnibox({ mode, setMode, getSuggestions, openSuggestion, submitSearch, submitChat }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const onSubmit = () => {};

    return (
        <div class={styles.root} data-mode={mode}>
            <div class={styles.logoWrap}>
                <img src="./icons/Logo-Stacked.svg" alt={t('omnibox_logoAlt')} width={144} height={115.9} />
            </div>
            <div class={styles.tabListWrap}>
                <div class={styles.tabList} role="tablist" aria-label={t('omnibox_tabList')}>
                    <button class={styles.tab} role="tab" aria-selected={mode === 'search'} onClick={() => setMode('search')}>
                        <SearchIcon className={styles.searchIcon} />
                        {t('omnibox_searchTab')}
                    </button>
                    <button class={styles.tab} role="tab" aria-selected={mode === 'ai'} onClick={() => setMode('ai')}>
                        <AiChatIcon className={styles.aiChatIcon} />
                        {t('omnibox_aiTab')}
                    </button>
                </div>
            </div>
            <div class={styles.formWrap}>
                <form onSubmit={onSubmit} class={styles.form}>
                    {/* @todo: clean this up with dumb components e.g. <InputContainer/>, <InputActions/>, <InputAction/> */}
                    <div class={styles.inputRoot} style={{ viewTransitionName: 'omnibox-input-transition' }}>
                        <div class={styles.inputContainer} style={{ viewTransitionName: 'omnibox-input-transition2' }}>
                            <input
                                // ref={ref}
                                type="text"
                                class={styles.input}
                                placeholder="Search or enter address"
                                aria-label="Search or enter address"
                                spellcheck={false}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                data-testid="searchInput"
                                // onInput={onInput}
                                // onKeyDown={onKeydown}
                                name="term"
                            />
                            <div class={styles.inputActions}>
                                {mode === 'search' ? (
                                    <>
                                        <button class={cn(styles.inputAction)} aria-label="Web search" inert>
                                            <SearchIcon />
                                        </button>
                                        <div class={styles.separator}></div>
                                        <button class={cn(styles.inputAction, styles.squareButton)} aria-label="Duck.ai" type="button">
                                            <AiChatIcon className={styles.aiChatIcon} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        class={cn(styles.inputAction, styles.squareButton, styles.aiSubmitButton)}
                                        aria-label="Duck.ai chat"
                                    >
                                        <ArrowRightIcon />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {mode === 'search' && <SuggestionList />}
                </form>
            </div>
        </div>
    );
}
