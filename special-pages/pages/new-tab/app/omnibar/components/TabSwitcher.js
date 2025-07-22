import { h } from 'preact';
import { AiChatColorIcon, AiChatIcon, SearchColorIcon, SearchIcon } from '../../components/Icons.js';
import { useTypedTranslationWith } from '../../types';
import styles from './TabSwitcher.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 */

/**
 * @param {object} props
 * @param {OmnibarConfig['mode']} props.mode
 * @param {(mode: OmnibarConfig['mode']) => void} props.onChange
 */
export function TabSwitcher({ mode, onChange }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    return (
        <div
            class={styles.tabSwitcher}
            style={{ '--tab-count': 2, '--tab-index': mode === 'search' ? 0 : 1 }}
            role="tablist"
            aria-label={t('omnibar_tabSwitcherLabel')}
        >
            <div class={styles.blob} />
            <button class={styles.tab} role="tab" aria-selected={mode === 'search'} onClick={() => onChange('search')}>
                {mode === 'search' ? <SearchColorIcon /> : <SearchIcon />}
                <span class={styles.tabLabel}>{t('omnibar_searchTabLabel')}</span>
            </button>
            <button class={styles.tab} role="tab" aria-selected={mode === 'ai'} onClick={() => onChange('ai')}>
                {mode === 'ai' ? <AiChatColorIcon /> : <AiChatIcon />}
                <span class={styles.tabLabel}>{t('omnibar_aiTabLabel')}</span>
            </button>
        </div>
    );
}
