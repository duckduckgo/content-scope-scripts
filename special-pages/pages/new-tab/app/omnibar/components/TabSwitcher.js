import { h } from 'preact';
import { AiChatIcon, SearchIcon } from '../../components/Icons.js';
import { useTypedTranslationWith } from '../../types';
import { viewTransition } from '../../utils';
import styles from './TabSwitcher.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 */

/**
 * @param {object} props
 * @param {OmnibarConfig['mode']} props.mode
 * @param {(mode: OmnibarConfig['mode']) => void} props.setMode
 */
export function TabSwitcher({ mode, setMode }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    return (
        <div class={styles.tabListWrap}>
            <div class={styles.tabList} role="tablist" aria-label={t('omnibar_tabSwitcherLabel')}>
                <button
                    class={styles.tab}
                    role="tab"
                    aria-selected={mode === 'search'}
                    onClick={() => {
                        viewTransition(() => {
                            setMode('search');
                        });
                    }}
                >
                    <SearchIcon className={styles.searchIcon} />
                    {t('omnibar_searchTabLabel')}
                </button>
                <button
                    class={styles.tab}
                    role="tab"
                    aria-selected={mode === 'ai'}
                    onClick={() => {
                        viewTransition(() => {
                            setMode('ai');
                        });
                    }}
                >
                    <AiChatIcon className={styles.aiChatIcon} />
                    {t('omnibar_aiTabLabel')}
                </button>
            </div>
        </div>
    );
}
