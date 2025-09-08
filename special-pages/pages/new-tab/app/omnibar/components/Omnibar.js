import { h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { LogoStacked } from '../../components/Icons';
import { useTypedTranslationWith } from '../../types';
import { AiChatForm } from './AiChatForm';
import styles from './Omnibar.module.css';
import { OmnibarContext } from './OmnibarProvider';
import { ResizingContainer } from './ResizingContainer';
import { SearchForm } from './SearchForm';
import { SearchFormProvider } from './SearchFormProvider';
import { SuggestionsList } from './SuggestionsList';
import { TabSwitcher } from './TabSwitcher';
import { useQueryWithLocalPersistence } from './PersistentOmnibarValuesProvider.js';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {OmnibarConfig['mode']} props.mode
 * @param {(mode: OmnibarConfig['mode']) => void} props.setMode
 * @param {boolean} props.enableAi
 * @param {string|null|undefined} props.tabId
 */
export function Omnibar({ mode, setMode, enableAi, tabId }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const [query, setQuery] = useQueryWithLocalPersistence(tabId);
    const [resetKey, setResetKey] = useState(0);
    const [autoFocus, setAutoFocus] = useState(false);

    const { openSuggestion, submitSearch, submitChat } = useContext(OmnibarContext);

    const resetForm = () => {
        setQuery('');
        setResetKey((prev) => prev + 1);
    };

    /** @type {(params: {suggestion: Suggestion, target: OpenTarget}) => void} */
    const handleOpenSuggestion = (params) => {
        openSuggestion(params);
        resetForm();
    };

    /** @type {(params: {term: string, target: OpenTarget}) => void} */
    const handleSubmitSearch = (params) => {
        submitSearch(params);
        resetForm();
    };

    /** @type {(params: {chat: string, target: OpenTarget}) => void} */
    const handleSubmitChat = (params) => {
        submitChat(params);
        resetForm();
    };

    /** @type {(mode: OmnibarConfig['mode']) => void} */
    const handleChangeMode = (nextMode) => {
        setAutoFocus(true);
        setMode(nextMode);
    };

    return (
        <div key={resetKey} class={styles.root} data-mode={mode}>
            <LogoStacked class={styles.logo} aria-label={t('omnibar_logoAlt')} />
            {enableAi && <TabSwitcher mode={mode} onChange={handleChangeMode} />}
            <SearchFormProvider term={query} setTerm={setQuery}>
                <div class={styles.spacer}>
                    <div class={styles.popup}>
                        <ResizingContainer className={styles.field}>
                            {mode === 'search' ? (
                                <SearchForm
                                    autoFocus={autoFocus}
                                    onOpenSuggestion={handleOpenSuggestion}
                                    onSubmit={handleSubmitSearch}
                                    onSubmitChat={handleSubmitChat}
                                />
                            ) : (
                                <AiChatForm chat={query} autoFocus={autoFocus} onChange={setQuery} onSubmit={handleSubmitChat} />
                            )}
                        </ResizingContainer>
                        {mode === 'search' && <SuggestionsList onOpenSuggestion={handleOpenSuggestion} onSubmitChat={handleSubmitChat} />}
                    </div>
                </div>
            </SearchFormProvider>
        </div>
    );
}
