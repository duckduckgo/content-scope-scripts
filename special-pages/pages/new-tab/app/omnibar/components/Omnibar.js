import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useTypedTranslationWith } from '../../types';
import { AiChatForm } from './AiChatForm';
import styles from './Omnibar.module.css';
import { SearchForm } from './SearchForm';
import { TabSwitcher } from './TabSwitcher';

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
    return (
        <div class={styles.root} data-mode={mode}>
            <img class={styles.logo} src="./icons/Logo-Stacked.svg" alt={t('omnibar_logoAlt')} width={123} height={99} />
            {enableAi && <TabSwitcher mode={mode} setMode={setMode} />}
            {mode === 'search' ? <SearchForm term={query} setTerm={setQuery} /> : <AiChatForm chat={query} setChat={setQuery} />}
        </div>
    );
}
