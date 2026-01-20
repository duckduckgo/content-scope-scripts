import { h } from 'preact';
import { useComputed } from '@preact/signals';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../types.js';
import styles from './ThemeSection.module.css';
import { LightThemeIcon, DarkThemeIcon, SystemThemeIcon } from '../../components/Icons.js';
import { useLocale } from '../../../../../shared/components/EnvironmentProvider.js';

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
    const locale = useLocale();

    return (
        <div class={styles.root}>
            <div
                class={cn(styles.segmentedControl, {
                    [styles.vertical]: locale === 'pl',
                })}
                role="radiogroup"
                aria-label={t('customizer_section_title_theme_variant')}
            >
                <button
                    class={styles.segment}
                    role="radio"
                    type="button"
                    aria-checked={currentTheme.value === 'light'}
                    tabIndex={currentTheme.value === 'light' ? -1 : 0}
                    onClick={() => setTheme({ theme: 'light', themeVariant: currentVariant.value })}
                >
                    <LightThemeIcon aria-hidden="true" />
                    <span>{t('customizer_browser_theme_light')}</span>
                </button>
                <span class={styles.separator} aria-hidden="true" />
                <button
                    class={styles.segment}
                    role="radio"
                    type="button"
                    aria-checked={currentTheme.value === 'dark'}
                    tabIndex={currentTheme.value === 'dark' ? -1 : 0}
                    onClick={() => setTheme({ theme: 'dark', themeVariant: currentVariant.value })}
                >
                    <DarkThemeIcon aria-hidden="true" />
                    <span>{t('customizer_browser_theme_dark')}</span>
                </button>
                <span class={styles.separator} aria-hidden="true" />
                <button
                    class={styles.segment}
                    role="radio"
                    type="button"
                    aria-checked={currentTheme.value === 'system'}
                    tabIndex={currentTheme.value === 'system' ? -1 : 0}
                    onClick={() => setTheme({ theme: 'system', themeVariant: currentVariant.value })}
                >
                    <SystemThemeIcon aria-hidden="true" />
                    <span>{t('customizer_browser_theme_system')}</span>
                </button>
            </div>

            <div class={styles.variantGrid} role="radiogroup" aria-label={t('customizer_theme_variant_grid_label')}>
                {THEME_VARIANTS.map((variant) => (
                    <button
                        key={variant.value}
                        class={styles.variantButton}
                        role="radio"
                        type="button"
                        aria-checked={currentVariant.value === variant.value}
                        aria-label={t(variant.labelKey)}
                        tabIndex={currentVariant.value === variant.value ? -1 : 0}
                        onClick={() => setTheme({ theme: currentTheme.value, themeVariant: variant.value })}
                    >
                        <ThemeSwatch variant={variant.value} />
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * @param {object} props
 * @param {ThemeVariant} props.variant
 */
function ThemeSwatch({ variant }) {
    return (
        <div class={styles.swatch} data-variant={variant}>
            <div class={styles.swatchBackdrop}>
                <div class={styles.swatchPrimary}>
                    <div class={styles.swatchSecondary}>
                        <div class={styles.swatchAccent} />
                    </div>
                </div>
            </div>
        </div>
    );
}
