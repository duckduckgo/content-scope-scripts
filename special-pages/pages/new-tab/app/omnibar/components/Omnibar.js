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
    
    // Get all context values
    const { 
        submitSearch, 
        submitChat, 
        openSuggestion, 
        getSuggestions, 
        onSuggestions 
    } = useContext(OmnibarContext);

    // Reset function
    const resetForm = useCallback(() => {
        setQuery('');
        setResetKey(prev => prev + 1);
    }, []);

    // Wrap context functions to reset form after they're called
    const handleSubmitSearch = useCallback((params) => {
        submitSearch(params);
        resetForm();
    }, [submitSearch, resetForm]);

    const handleSubmitChat = useCallback((params) => {
        submitChat(params);
        resetForm();
    }, [submitChat, resetForm]);

    const handleOpenSuggestion = useCallback((params) => {
        openSuggestion(params);
        resetForm();
    }, [openSuggestion, resetForm]);

    return (
        <div class={styles.root} data-mode={mode}>
            <LogoStacked class={styles.logo} aria-label={t('omnibar_logoAlt')} />
            {enableAi && <TabSwitcher mode={mode} setMode={setMode} />}
            <Container overflow={mode === 'search'}>
                {mode === 'search' ? (
                    <SearchForm 
                        key={`search-${resetKey}`}
                        term={query} 
                        setTerm={setQuery}
                        submitSearch={handleSubmitSearch}
                        openSuggestion={handleOpenSuggestion}
                        getSuggestions={getSuggestions}
                        onSuggestions={onSuggestions}
                    />
                ) : (
                    <AiChatForm 
                        key={`chat-${resetKey}`}
                        chat={query} 
                        setChat={setQuery}
                        submitChat={handleSubmitChat}
                    />
                )}
            </Container>
        </div>
    );
}
