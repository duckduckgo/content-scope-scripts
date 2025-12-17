import { h } from 'preact';
import { useComputed } from '@preact/signals';
import { useTypedTranslationWith } from '../../types.js';

/**
 * @import enStrings from '../strings.json';
 * @typedef {enStrings} strings
 * @typedef {import('../../../types/new-tab').ThemeVariant} ThemeVariant
 * @typedef {import('../../../types/new-tab').CustomizerData} CustomizerData
 * @typedef {import('../../../types/new-tab').ThemeData} ThemeData
 */

/**
 * @type {Array<{value: ThemeVariant, labelKey: keyof strings}>}
 */
const THEME_VARIANTS = [
    { value: 'default', labelKey: 'customizer_theme_variant_default' },
    { value: 'coolGray', labelKey: 'customizer_theme_variant_coolGray' },
    { value: 'slateBlue', labelKey: 'customizer_theme_variant_slateBlue' },
    { value: 'green', labelKey: 'customizer_theme_variant_green' },
    { value: 'violet', labelKey: 'customizer_theme_variant_violet' },
    { value: 'rose', labelKey: 'customizer_theme_variant_rose' },
    { value: 'orange', labelKey: 'customizer_theme_variant_orange' },
    { value: 'desert', labelKey: 'customizer_theme_variant_desert' },
];

/**
 * @param {object} props
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 * @param {(theme: ThemeData) => void} props.setTheme
 */
export function ThemeSection({ data, setTheme }) {
    const currentTheme = useComputed(() => data.value.theme);
    const currentVariant = useComputed(() => data.value.themeVariant ?? 'default');
    const { t } = useTypedTranslationWith(/** @type {strings} */ ({}));

    return (
        <div>
            <ul>
                <li>
                    <button
                        role="radio"
                        type="button"
                        aria-checked={currentTheme.value === 'light'}
                        tabindex={currentTheme.value === 'light' ? -1 : 0}
                        onClick={() => setTheme({ theme: 'light', themeVariant: currentVariant.value })}
                    >
                        {t('customizer_browser_theme_light')}
                    </button>
                </li>
                <li>
                    <button
                        role="radio"
                        type="button"
                        aria-checked={currentTheme.value === 'dark'}
                        tabindex={currentTheme.value === 'dark' ? -1 : 0}
                        onClick={() => setTheme({ theme: 'dark', themeVariant: currentVariant.value })}
                    >
                        {t('customizer_browser_theme_dark')}
                    </button>
                </li>
                <li>
                    <button
                        role="radio"
                        type="button"
                        aria-checked={currentTheme.value === 'system'}
                        tabindex={currentTheme.value === 'system' ? -1 : 0}
                        onClick={() => setTheme({ theme: 'system', themeVariant: currentVariant.value })}
                    >
                        {t('customizer_browser_theme_system')}
                    </button>
                </li>
            </ul>

            <ul>
                {THEME_VARIANTS.map((variant) => (
                    <li key={variant.value}>
                        <button
                            role="radio"
                            type="button"
                            aria-checked={currentVariant.value === variant.value}
                            tabindex={currentVariant.value === variant.value ? -1 : 0}
                            onClick={() => setTheme({ theme: currentTheme.value, themeVariant: variant.value })}
                        >
                            {t(variant.labelKey)}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
