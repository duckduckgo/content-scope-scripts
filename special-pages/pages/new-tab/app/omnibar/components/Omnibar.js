import { h } from 'preact';
import { useContext, useId, useState } from 'preact/hooks';
import { LogoStacked } from '../../components/Icons';
import { useTypedTranslationWith } from '../../types';
import { AiChatForm } from './AiChatForm';
import { Container } from './Container';
import styles from './Omnibar.module.css';
import { OmnibarContext } from './OmnibarProvider';
import { SearchForm } from './SearchForm';
import { SuggestionsList } from './SuggestionsList';
import { SuggestionsProvider } from './SuggestionsProvider';
import { TabSwitcher } from './TabSwitcher';

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
 */
export function Omnibar({ mode, setMode, enableAi }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const suggestionsListId = useId();

    const [query, setQuery] = useState(/** @type {String} */ (''));
    const [resetKey, setResetKey] = useState(0);
    const [autoFocus, setAutoFocus] = useState(false);
    const [focusRing, setFocusRing] = useState(/** @type {boolean|undefined} */ (undefined));

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
        setFocusRing(undefined);
        setMode(nextMode);
    };

    return (
        <div class={styles.root} data-mode={mode}>
            <LogoStacked class={styles.logo} aria-label={t('omnibar_logoAlt')} />
            {enableAi && <TabSwitcher mode={mode} onChange={handleChangeMode} />}
            <SuggestionsProvider
                key={`search-${resetKey}`}
                // Remove any newlines that come from switching from chat to search
                term={query.replace(/\n/g, '')}
                onChangeTerm={setQuery}
                onOpenSuggestion={handleOpenSuggestion}
                onSubmitSearch={handleSubmitSearch}
            >
                <Container
                    mode={mode}
                    focusRing={focusRing}
                    suggestions={
                        mode === 'search' ? (
                            <SuggestionsList id={suggestionsListId} term={query} onOpenSuggestion={handleOpenSuggestion} />
                        ) : null
                    }
                >
                    {mode === 'search' ? (
                        <SearchForm
                            // Remove any newlines that come from switching from chat to search
                            term={query.replace(/\n/g, '')}
                            autoFocus={autoFocus}
                            suggestionsListId={suggestionsListId}
                            onSubmitSearch={handleSubmitSearch}
                        />
                    ) : (
                        <AiChatForm
                            key={`chat-${resetKey}`}
                            chat={query}
                            autoFocus={autoFocus}
                            onFocus={() => setFocusRing(true)}
                            onBlur={() => setFocusRing(false)}
                            onInput={() => setFocusRing(false)}
                            onChange={setQuery}
                            onSubmit={handleSubmitChat}
                        />
                    )}
                </Container>
            </SuggestionsProvider>
        </div>
    );
}
