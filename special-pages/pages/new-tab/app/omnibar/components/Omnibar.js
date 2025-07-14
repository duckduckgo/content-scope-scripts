import { h } from 'preact';
import { useState, useContext, useCallback } from 'preact/hooks';
import { LogoStacked } from '../../components/Icons';
import { useTypedTranslationWith } from '../../types';
import { AiChatForm } from './AiChatForm';
import styles from './Omnibar.module.css';
import { SearchForm } from './SearchForm';
import { TabSwitcher } from './TabSwitcher';
import { Container } from './Container';
import { OmnibarContext } from './OmnibarProvider';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 */

/**
 * @param {object} props
 * @param {OmnibarConfig['mode']} props.mode
 * @param {(mode: OmnibarConfig['mode']) => void} props.setMode
 * @param {boolean} props.enableAi
 */
export function Omnibar({ mode, setMode, enableAi }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const [query, setQuery] = useState(/** @type {String} */ (''));
    const [resetKey, setResetKey] = useState(0);
    const { submitSearch, submitChat, openSuggestion, ...otherContextValues } = useContext(OmnibarContext);

    // Wrap the context functions to reset form state after they're called
    const handleSubmitSearch = useCallback((params) => {
        submitSearch(params);
        setQuery('');
        setResetKey(prev => prev + 1);
    }, [submitSearch]);

    const handleSubmitChat = useCallback((params) => {
        submitChat(params);
        setQuery('');
        setResetKey(prev => prev + 1);
    }, [submitChat]);

    const handleOpenSuggestion = useCallback((params) => {
        openSuggestion(params);
        setQuery('');
        setResetKey(prev => prev + 1);
    }, [openSuggestion]);

    // Create a custom context with the wrapped functions
    const customContext = {
        ...otherContextValues,
        submitSearch: handleSubmitSearch,
        submitChat: handleSubmitChat,
        openSuggestion: handleOpenSuggestion,
    };

    return (
        <OmnibarContext.Provider value={customContext}>
            <div class={styles.root} data-mode={mode}>
                <LogoStacked class={styles.logo} aria-label={t('omnibar_logoAlt')} />
                {enableAi && <TabSwitcher mode={mode} setMode={setMode} />}
                <Container overflow={mode === 'search'}>
                    {mode === 'search' ? (
                        <SearchForm key={`search-${resetKey}`} term={query} setTerm={setQuery} />
                    ) : (
                        <AiChatForm key={`chat-${resetKey}`} chat={query} setChat={setQuery} />
                    )}
                </Container>
            </div>
        </OmnibarContext.Provider>
    );
}
