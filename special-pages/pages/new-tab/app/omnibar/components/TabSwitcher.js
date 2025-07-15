import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { AiChatColorIcon, AiChatIcon, SearchColorIcon, SearchIcon } from '../../components/Icons.js';
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
    const { main } = useContext(CustomizerThemesContext);
    const Blob = main.value === 'light' ? BlobLight : BlobDark;
    return (
        <div class={styles.tabSwitcher} role="tablist" aria-label={t('omnibar_tabSwitcherLabel')}>
            <Blob class={styles.blob} style={{ translate: mode === 'search' ? 0 : 92 }} />
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

/**
 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
 */
function BlobLight(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="102" height="36" viewBox="0 0 102 36" fill="none" {...props}>
            <g filter="url(#filter0_ddi_9483_24565)">
                <path
                    d="M2 18C2 9.16344 9.16344 2 18 2H78C86.8366 2 94 9.16344 94 18C94 26.8366 86.8366 34 78 34H18C9.16345 34 2 26.8366 2 18Z"
                    fill="white"
                />
            </g>
            <defs>
                <filter
                    id="filter0_ddi_9483_24565"
                    x="-6"
                    y="-2"
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
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9483_24565" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
                    <feBlend mode="normal" in2="effect1_dropShadow_9483_24565" result="effect2_dropShadow_9483_24565" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_9483_24565" result="shape" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.48 0" />
                    <feBlend mode="normal" in2="shape" result="effect3_innerShadow_9483_24565" />
                </filter>
            </defs>
        </svg>
    );
}

/**
 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
 */
function BlobDark(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="102" height="36" viewBox="0 0 102 36" fill="none" {...props}>
            <g filter="url(#filter0_ddi_9483_35175)">
                <path
                    d="M2 18C2 9.16344 9.16344 2 18 2H78C86.8366 2 94 9.16344 94 18C94 26.8366 86.8366 34 78 34H18C9.16345 34 2 26.8366 2 18Z"
                    fill="#6B6B6B"
                />
            </g>
            <defs>
                <filter
                    id="filter0_ddi_9483_35175"
                    x="-6"
                    y="-2"
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
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9483_35175" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0" />
                    <feBlend mode="normal" in2="effect1_dropShadow_9483_35175" result="effect2_dropShadow_9483_35175" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_9483_35175" result="shape" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.976471 0 0 0 0 0.976471 0 0 0 0.06 0" />
                    <feBlend mode="normal" in2="shape" result="effect3_innerShadow_9483_35175" />
                </filter>
            </defs>
        </svg>
    );
}
