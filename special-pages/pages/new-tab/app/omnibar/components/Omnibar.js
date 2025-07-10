import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useTypedTranslationWith } from '../../types';
import { AiChatForm } from './AiChatForm';
import styles from './Omnibar.module.css';
import { SearchForm } from './SearchForm';
import { TabSwitcher } from './TabSwitcher';
import { LogoStacked } from '../../components/Icons';

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
            <LogoStacked class={styles.logo} aria-label={t('omnibar_logoAlt')} />
            {enableAi && <TabSwitcher mode={mode} setMode={setMode} />}
            {mode === 'search' ? <SearchForm term={query} setTerm={setQuery} /> : <AiChatForm chat={query} setChat={setQuery} />}
        </div>
    );
}
