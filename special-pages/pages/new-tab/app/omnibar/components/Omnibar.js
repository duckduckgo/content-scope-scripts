import { h } from 'preact';
import { useState, useContext } from 'preact/hooks';
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
    
    const { 
        submitSearch: _submitSearch, 
        submitChat: _submitChat, 
        openSuggestion: _openSuggestion, 
        getSuggestions, 
        onSuggestions 
    } = useContext(OmnibarContext);

    const resetForm = () => {
        setQuery('');
        setResetKey(prev => prev + 1);
    };

    const onSubmitSearch = (params) => {
        _submitSearch(params);
        resetForm();
    };

    const onSubmitChat = (params) => {
        _submitChat(params);
        resetForm();
    };

    const onOpenSuggestion = (params) => {
        _openSuggestion(params);
        resetForm();
    };

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
                        submitSearch={onSubmitSearch}
                        openSuggestion={onOpenSuggestion}
                        getSuggestions={getSuggestions}
                        onSuggestions={onSuggestions}
                    />
                ) : (
                    <AiChatForm 
                        key={`chat-${resetKey}`}
                        chat={query} 
                        setChat={setQuery}
                        submitChat={onSubmitChat}
                    />
                )}
            </Container>
        </div>
    );
}
