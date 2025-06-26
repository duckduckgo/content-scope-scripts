import { useState } from 'preact/hooks';
import { h } from 'preact';
import { useTypedTranslationWith } from '../../types.js';

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
    const [searchTerm, setSearchTerm] = useState('');

    // TODO: Implement full UI with:
    // - Mode switcher (Search/AI)
    // - Search input field
    // - Suggestions dropdown
    // - Form submission handling
    // - Keyboard navigation

    return (
        <div>
            <h3>Omnibox (Stubbed)</h3>
            <p>Current mode: {mode}</p>
            <p>Search term: {searchTerm}</p>
            <input
                type="text"
                value={searchTerm}
                // onChange={(e) => setSearchTerm(e.target.value)}
                // placeholder={mode === 'search' ? t('omnibox_searchPlaceholder') : t('omnibox_aiPlaceholder')}
            />
            <button onClick={() => setMode(mode === 'search' ? 'ai' : 'search')}>Toggle Mode</button>
        </div>
    );
}
