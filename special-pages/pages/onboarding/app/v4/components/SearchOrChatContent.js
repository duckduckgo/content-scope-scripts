import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslation } from '../../types';
import { useGlobalState } from '../../global';
import { Container } from './Container';
import { AiChatColorIcon, AiChatIcon, SearchColorIcon, SearchIcon, SubmitArrowIcon, SurpriseIcon } from './SearchOrChatIcons';
import styles from './SearchOrChatContent.module.css';

/**
 * @typedef {import('../../types').SearchOrChatVariant} SearchOrChatVariant
 * @typedef {import('../../types').SubmitQueryParams} SubmitQueryParams
 * @typedef {SubmitQueryParams['mode']} QueryMode
 * @typedef {import('../../types').TranslationFn} TranslationFn
 * @typedef {{ label: string; query: string; icon: 'search' | 'aiChat' | 'surprise' }} Suggestion
 */

/**
 * The suggestions shown under the input. Each sends its label, except "Surprise me!".
 * A search's "Surprise me!" is an image search, sent with the `!image` bang so native handles it like any other search.
 *
 * @param {QueryMode} mode
 * @param {SearchOrChatVariant} variant
 * @param {TranslationFn} t
 * @returns {Suggestion[]}
 */
export function suggestionsFor(mode, variant, t) {
    if (mode === 'duckAi') {
        return [
            { label: t('searchOrChat_aiSuggestion1'), query: t('searchOrChat_aiSuggestion1'), icon: 'aiChat' },
            { label: t('searchOrChat_aiSuggestion2'), query: t('searchOrChat_aiSuggestion2'), icon: 'aiChat' },
            { label: t('searchOrChat_surpriseMe'), query: t('searchOrChat_aiSurprisePrompt'), icon: 'surprise' },
        ];
    }
    const second = variant === 'searchOnly' ? t('searchOrChat_searchOnlySuggestion2') : t('searchOrChat_searchSuggestion2');
    return [
        { label: t('searchOrChat_searchSuggestion1'), query: t('searchOrChat_searchSuggestion1'), icon: 'search' },
        { label: second, query: second, icon: 'search' },
        { label: t('searchOrChat_surpriseMe'), query: `!image ${t('searchOrChat_searchSurpriseQuery')}`, icon: 'surprise' },
    ];
}

/**
 * Bottom bubble content for the searchOrChat step: an optional Search / Ask AI toggle,
 * a text input and three suggestions. Submitting sends the query to native, which ends onboarding.
 *
 * @param {object} props
 * @param {SearchOrChatVariant} props.variant - 'searchOnly' hides the toggle and Duck.ai
 * @param {(params: SubmitQueryParams) => void} props.submitQuery
 */
export function SearchOrChatContent({ variant, submitQuery }) {
    const { t } = useTypedTranslation();
    const { activeStepVisible } = useGlobalState();
    const [mode, setMode] = useState(/** @type {QueryMode} */ ('search'));
    const [text, setText] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const inputRef = useRef(/** @type {HTMLTextAreaElement|null} */ (null));

    useEffect(() => {
        if (activeStepVisible) inputRef.current?.focus();
    }, [activeStepVisible, mode]);

    /** @param {SubmitQueryParams} params */
    const submit = (params) => {
        // Native ends onboarding on the first query; ignore repeats while it does.
        if (submitted) return;
        setSubmitted(true);
        submitQuery(params);
    };

    const submitTyped = () => {
        const query = text.trim();
        if (!query) return;
        submit({ mode, query, source: 'typed' });
    };

    /** @param {KeyboardEvent} e */
    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            submitTyped();
        }
    };

    const placeholder = mode === 'duckAi' ? t('searchOrChat_aiPlaceholder') : t('searchOrChat_searchPlaceholder');

    return (
        <Container class={styles.root}>
            {variant === 'searchAndDuckAi' && <ModeToggle mode={mode} onChange={setMode} />}
            <form
                class={styles.inputField}
                onSubmit={(e) => {
                    e.preventDefault();
                    submitTyped();
                }}
            >
                <textarea
                    ref={inputRef}
                    class={styles.input}
                    rows={2}
                    value={text}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    onInput={(e) => setText(e.currentTarget.value)}
                    onKeyDown={onKeyDown}
                />
                <button type="submit" class={styles.submit} aria-label={t('searchOrChat_submitLabel')} disabled={!text.trim() || submitted}>
                    <SubmitArrowIcon />
                </button>
            </form>
            <ul class={styles.suggestions}>
                {suggestionsFor(mode, variant, t).map((suggestion) => (
                    <li key={suggestion.label}>
                        <button
                            type="button"
                            class={styles.suggestion}
                            disabled={submitted}
                            onClick={() => submit({ mode, query: suggestion.query, source: 'suggestion' })}
                        >
                            <SuggestionIcon icon={suggestion.icon} />
                            <span class={styles.suggestionLabel}>{suggestion.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </Container>
    );
}

/**
 * Search / Ask AI segmented control, styled like the New Tab Page omnibar's.
 *
 * @param {object} props
 * @param {QueryMode} props.mode
 * @param {(mode: QueryMode) => void} props.onChange
 */
function ModeToggle({ mode, onChange }) {
    const { t } = useTypedTranslation();
    /** @type {{ id: QueryMode; label: string; icon: import('preact').ComponentChild; selectedIcon: import('preact').ComponentChild }[]} */
    const tabs = [
        { id: 'search', label: t('searchOrChat_searchTab'), icon: <SearchIcon />, selectedIcon: <SearchColorIcon /> },
        { id: 'duckAi', label: t('searchOrChat_aiTab'), icon: <AiChatIcon />, selectedIcon: <AiChatColorIcon /> },
    ];
    return (
        <div class={styles.toggle} role="tablist" aria-label={t('searchOrChat_toggleLabel')}>
            {tabs.map((tab) => {
                const selected = tab.id === mode;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        class={cn(styles.tab, { [styles.selected]: selected })}
                        onClick={() => onChange(tab.id)}
                    >
                        {selected ? tab.selectedIcon : tab.icon}
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * @param {object} props
 * @param {Suggestion['icon']} props.icon
 */
function SuggestionIcon({ icon }) {
    if (icon === 'aiChat') return <AiChatIcon />;
    if (icon === 'surprise') return <SurpriseIcon />;
    return <SearchIcon />;
}
