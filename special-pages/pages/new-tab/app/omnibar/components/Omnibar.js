import { Fragment, h } from 'preact';
import { useCallback, useContext, useRef, useState } from 'preact/hooks';
import { LogoStacked } from '../../components/Icons';
import { useTypedTranslationWith } from '../../types';
import { AiChatForm } from './AiChatForm';
import styles from './Omnibar.module.css';
import { OmnibarContext } from './OmnibarProvider';
import { ResizingContainer } from './ResizingContainer';
import { SearchForm } from './SearchForm';
import { SearchFormProvider } from './SearchFormProvider';
import { SuggestionsList } from './SuggestionsList';
import { AiChatsList } from './AiChatsList';
import { AiChatsProvider, useAiChatsContext } from './AiChatsProvider';
import { TabSwitcher } from './TabSwitcher';
import { useQueryWithLocalPersistence } from './PersistentOmnibarValuesProvider.js';
import { Popover } from '../../components/Popover';
import { useDrawerControls, useDrawerEventListeners } from '../../components/Drawer';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 * @typedef {import('../../../types/new-tab.js').SubmitChatAction} SubmitChatAction
 */

/**
 * @param {object} props
 * @param {OmnibarConfig['mode']} props.mode
 * @param {(mode: OmnibarConfig['mode']) => void} props.setMode
 * @param {boolean} props.enableAi
 * @param {boolean} props.enableRecentAiChats
 * @param {boolean} props.showCustomizePopover
 * @param {string|null|undefined} props.tabId
 */
export function Omnibar({ mode, setMode, enableAi, enableRecentAiChats, showCustomizePopover, tabId }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const [query, setQuery] = useQueryWithLocalPersistence(tabId);
    const [resetKey, setResetKey] = useState(0);
    const [autoFocus, setAutoFocus] = useState(false);

    const { openSuggestion, submitSearch, submitChat, setShowCustomizePopover } = useContext(OmnibarContext);

    const { open: openCustomizer } = useDrawerControls();
    useDrawerEventListeners(
        {
            onOpen: () => setShowCustomizePopover(false),
            onToggle: () => setShowCustomizePopover(false),
        },
        [setShowCustomizePopover],
    );

    const resetForm = () => {
        setQuery('');
        setResetKey((prev) => prev + 1);
    };

    const handleCloseCustomizePopover = useCallback(() => {
        setShowCustomizePopover(false);
    }, [setShowCustomizePopover]);

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

    /** @type {(params: SubmitChatAction) => void} */
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
            {enableAi && (
                <div class={styles.tabSwitcherContainer}>
                    <TabSwitcher mode={mode} onChange={handleChangeMode} />
                    {showCustomizePopover && (
                        <Popover
                            className={styles.popover}
                            title={t('omnibar_customizePopoverTitle')}
                            showNewBadge
                            onClose={handleCloseCustomizePopover}
                        >
                            <Trans
                                str={t('omnibar_customizePopoverDescription')}
                                values={{
                                    button: {
                                        click: () => openCustomizer(),
                                    },
                                }}
                            />
                        </Popover>
                    )}
                </div>
            )}
            <SearchFormProvider term={query} setTerm={setQuery} enableAi={enableAi}>
                <AiChatsProvider query={query} autoFocus={autoFocus} enableRecentAiChats={enableRecentAiChats}>
                    <div class={styles.spacer}>
                        <div class={styles.popup}>
                            {mode === 'search' ? (
                                <>
                                    <ResizingContainer className={styles.field}>
                                        <SearchForm
                                            autoFocus={autoFocus}
                                            onOpenSuggestion={handleOpenSuggestion}
                                            onSubmit={handleSubmitSearch}
                                            onSubmitChat={handleSubmitChat}
                                        />
                                    </ResizingContainer>
                                    <SuggestionsList onOpenSuggestion={handleOpenSuggestion} onSubmitChat={handleSubmitChat} />
                                </>
                            ) : (
                                <AiChatContent
                                    query={query}
                                    autoFocus={autoFocus}
                                    enableRecentAiChats={enableRecentAiChats}
                                    onChange={setQuery}
                                    onSubmit={handleSubmitChat}
                                />
                            )}
                        </div>
                    </div>
                </AiChatsProvider>
            </SearchFormProvider>
        </div>
    );
}

/**
 * @param {object} props
 * @param {string} props.query
 * @param {boolean} [props.autoFocus]
 * @param {boolean} props.enableRecentAiChats
 * @param {(query: string) => void} props.onChange
 * @param {(params: SubmitChatAction) => void} props.onSubmit
 */
function AiChatContent({ query, autoFocus, enableRecentAiChats, onSubmit, onChange }) {
    const { showChats, hideChats } = useAiChatsContext();
    const containerRef = useRef(/** @type {HTMLDivElement|null} */ (null));

    return (
        <div
            ref={containerRef}
            // Using capture-phase events because WebKit doesn't reliably fire bubbling focus/blur (e.g. address bar, window refocus).
            // Only show chats on textarea focus to avoid triggering when toolbar buttons (model selector, image upload) receive focus.
            onFocusCapture={(event) => {
                if (event.target instanceof HTMLTextAreaElement) showChats();
            }}
            onBlurCapture={(event) => {
                if (event.relatedTarget instanceof Element && containerRef.current?.contains(event.relatedTarget)) {
                    return;
                }

                hideChats();
            }}
        >
            <ResizingContainer className={styles.field}>
                <AiChatForm query={query} autoFocus={autoFocus} onChange={onChange} onSubmit={onSubmit} />
            </ResizingContainer>
            {enableRecentAiChats && <AiChatsList className={styles.aiChatsList} />}
        </div>
    );
}
