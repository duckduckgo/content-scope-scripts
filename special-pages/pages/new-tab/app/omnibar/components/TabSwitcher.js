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
 * @param {(mode: OmnibarConfig['mode']) => void} props.setMode
 */
export function TabSwitcher({ mode, setMode }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    return (
        <div class={styles.tabSwitcher} role="tablist" aria-label={t('omnibar_tabSwitcherLabel')}>
            <Blob class={styles.blob} style={{ translate: mode === 'search' ? 0 : 92 }} />
            <button class={styles.tab} role="tab" aria-selected={mode === 'search'} onClick={() => setMode('search')}>
                {mode === 'search' ? <SearchColorIcon /> : <SearchIcon />}
                <span class={styles.tabLabel}>{t('omnibar_searchTabLabel')}</span>
            </button>
            <button class={styles.tab} role="tab" aria-selected={mode === 'ai'} onClick={() => setMode('ai')}>
                {mode === 'ai' ? <AiChatColorIcon /> : <AiChatIcon />}
                <span class={styles.tabLabel}>{t('omnibar_aiTabLabel')}</span>
            </button>
        </div>
    );
}

/**
 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
 */
function Blob(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="108" height="48" viewBox="0 0 108 48" fill="none" {...props}>
            <g filter="url(#filter0_ddi_26080_85978)">
                <path
                    d="M8 20C8 11.1634 15.1634 4 24 4H84C92.8366 4 100 11.1634 100 20C100 28.8366 92.8366 36 84 36H24C15.1634 36 8 28.8366 8 20Z"
                    fill="white"
                />
            </g>
            <defs>
                <filter
                    id="filter0_ddi_26080_85978"
                    x="0"
                    y="0"
                    width="108"
                    height="48"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="4" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_26080_85978" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
                    <feBlend mode="normal" in2="effect1_dropShadow_26080_85978" result="effect2_dropShadow_26080_85978" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_26080_85978" result="shape" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.48 0" />
                    <feBlend mode="normal" in2="shape" result="effect3_innerShadow_26080_85978" />
                </filter>
            </defs>
        </svg>
    );
}
