import { useCallback, useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';

/**
 * @typedef {NonNullable<import('../../../types/new-tab.js').UsageLimitsDrawer>} UsageLimitsDrawerConfig
 * @typedef {NonNullable<UsageLimitsDrawerConfig['icon']>} UsageLimitsIcon
 * @typedef {NonNullable<UsageLimitsDrawerConfig['severity']>} UsageLimitsSeverity
 * @typedef {NonNullable<NonNullable<UsageLimitsDrawerConfig['cta']>['leadingIcon']>} UsageLimitsCtaLeadingIcon
 */

/** @satisfies {readonly UsageLimitsIcon[]} */
const USAGE_LIMITS_ICON_VALUES = /** @type {const} */ (['info', 'ring', 'alert']);

/** @satisfies {readonly UsageLimitsSeverity[]} */
const USAGE_LIMITS_SEVERITY_VALUES = /** @type {const} */ (['neutral', 'warning', 'critical']);

/** @satisfies {readonly UsageLimitsCtaLeadingIcon[]} */
const USAGE_LIMITS_CTA_LEADING_ICON_VALUES = /** @type {const} */ (['none', 'convert']);

/**
 * Reads the native-driven usageLimits presentation from OmnibarConfig.
 *
 * @returns {{
 *   message: string,
 *   secondaryText: string,
 *   icon: 'info' | 'ring' | 'alert',
 *   percent: number,
 *   severity: 'neutral' | 'warning' | 'critical',
 *   cta: import('./UsageLimitsDrawer.js').UsageLimitsCta | null,
 *   blocksPrompt: boolean,
 *   dismissible: boolean,
 *   onDismiss: (() => void) | undefined,
 *   onSelectCta: ((modelId?: string) => void) | undefined,
 * } | null}
 */
export function useUsageLimitsDrawer() {
    const { state, dismissUsageLimits, selectUsageLimitsCta } = useContext(OmnibarContext);
    const usageLimits = state.config?.usageLimits ?? null;

    const onDismiss = useCallback(() => {
        dismissUsageLimits();
    }, [dismissUsageLimits]);

    const onSelectCta = useCallback(
        (/** @type {string | undefined} */ modelId) => {
            selectUsageLimitsCta(modelId);
        },
        [selectUsageLimitsCta],
    );

    if (!usageLimits) {
        return null;
    }

    const icon = usageLimits.icon && USAGE_LIMITS_ICON_VALUES.includes(usageLimits.icon) ? usageLimits.icon : 'info';
    const severity = usageLimits.severity && USAGE_LIMITS_SEVERITY_VALUES.includes(usageLimits.severity) ? usageLimits.severity : 'neutral';

    const rawCta = usageLimits.cta ?? null;
    /** @type {import('./UsageLimitsDrawer.js').UsageLimitsCta | null} */
    const cta =
        rawCta && typeof rawCta.label === 'string'
            ? {
                  label: rawCta.label,
                  leadingIcon:
                      rawCta.leadingIcon && USAGE_LIMITS_CTA_LEADING_ICON_VALUES.includes(rawCta.leadingIcon) ? rawCta.leadingIcon : 'none',
                  primaryModelId: rawCta.primaryModelId,
                  showMenu: rawCta.showMenu === true,
                  menuHeader: typeof rawCta.menuHeader === 'string' ? rawCta.menuHeader : undefined,
                  alternatives: Array.isArray(rawCta.alternatives)
                      ? rawCta.alternatives.filter((alt) => alt && typeof alt.id === 'string' && typeof alt.name === 'string')
                      : [],
              }
            : null;

    return {
        message: usageLimits.message,
        secondaryText: usageLimits.secondaryText ?? '',
        icon,
        percent: typeof usageLimits.percent === 'number' ? usageLimits.percent : 0,
        severity,
        cta,
        blocksPrompt: usageLimits.blocksPrompt === true,
        dismissible: usageLimits.dismissible === true,
        onDismiss: usageLimits.dismissible === true ? onDismiss : undefined,
        onSelectCta: cta ? onSelectCta : undefined,
    };
}
