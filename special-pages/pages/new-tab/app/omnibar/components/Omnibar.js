import { h } from 'preact';
import { useContext, useState } from 'preact/hooks';
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
    const [query, setQuery] = useState(/** @type {String} */ (''));
    const [resetKey, setResetKey] = useState(0);

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

    return (
        <div class={styles.root} data-mode={mode}>
            <LogoStacked class={styles.logo} aria-label={t('omnibar_logoAlt')} />
            {enableAi && <TabSwitcher mode={mode} onChange={setMode} />}
            <Container overflow={mode === 'search'}>
                {mode === 'search' ? (
                    <SearchForm
                        key={`search-${resetKey}`}
                        term={query}
                        onChangeTerm={setQuery}
                        onOpenSuggestion={handleOpenSuggestion}
                        onSubmitSearch={handleSubmitSearch}
                    />
                ) : (
                    <AiChatForm key={`chat-${resetKey}`} chat={query} onChange={setQuery} onSubmit={handleSubmitChat} />
                )}
            </Container>
        </div>
    );
}
