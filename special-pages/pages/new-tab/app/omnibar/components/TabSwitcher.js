import { h } from 'preact';
import { useContext } from 'preact/hooks';
import {
    AiChatColorIcon,
    AiChatOnDarkColorIcon,
    AiChatIcon,
    SearchColorIcon,
    SearchOnDarkColorIcon,
    SearchIcon,
} from '../../components/Icons.js';
import { CustomizerThemesContext } from '../../customizer/CustomizerProvider.js';
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
                <TabIcon mode="search" selected={mode === 'search'} />
                <span class={styles.tabLabel}>{t('omnibar_searchTabLabel')}</span>
            </button>
            <button class={styles.tab} role="tab" aria-selected={mode === 'ai'} onClick={() => onChange('ai')}>
                <TabIcon mode="ai" selected={mode === 'ai'} />
                <span class={styles.tabLabel}>{t('omnibar_aiTabLabel')}</span>
            </button>
        </div>
    );
}

/**
 *
 * @param {object} props
 * @param {OmnibarConfig['mode']} props.mode
 * @param {boolean} props.selected
 */
function TabIcon({ mode, selected }) {
    const { main } = useContext(CustomizerThemesContext);
    if (mode === 'search') {
        if (selected) return main.value === 'light' ? <SearchColorIcon /> : <SearchOnDarkColorIcon />;
        return <SearchIcon />;
    } else {
        if (selected) return main.value === 'light' ? <AiChatColorIcon /> : <AiChatOnDarkColorIcon />;
        return <AiChatIcon />;
    }
}
