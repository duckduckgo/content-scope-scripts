import { useCallback, useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';

/**
 * Reads the native-driven usageLimits presentation from OmnibarConfig.
 *
 * @returns {{
 *   visible: boolean,
 *   message: string,
 *   secondaryText: string,
 *   icon: 'info' | 'ring' | 'alert',
 *   percent: number,
 *   severity: 'neutral' | 'warning' | 'critical',
 *   cta: import('./UsageLimitsDrawer.js').UsageLimitsCta | null,
 *   dismissible: boolean,
 *   onDismiss: (() => void) | undefined,
 *   onSelectCta: ((modelId?: string) => void) | undefined,
 * }}
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
        return {
            visible: false,
            message: '',
            secondaryText: '',
            icon: /** @type {const} */ ('info'),
            percent: 0,
            severity: /** @type {const} */ ('neutral'),
            cta: null,
            dismissible: false,
            onDismiss: undefined,
            onSelectCta: undefined,
        };
    }

    const icon = usageLimits.icon === 'ring' || usageLimits.icon === 'alert' ? usageLimits.icon : 'info';
    const severity = usageLimits.severity === 'warning' || usageLimits.severity === 'critical' ? usageLimits.severity : 'neutral';

    const rawCta = usageLimits.cta ?? null;
    /** @type {import('./UsageLimitsDrawer.js').UsageLimitsCta | null} */
    const cta =
        rawCta && typeof rawCta.label === 'string'
            ? {
                  label: rawCta.label,
                  leadingIcon: rawCta.leadingIcon === 'convert' ? 'convert' : 'none',
                  primaryModelId: rawCta.primaryModelId,
                  showMenu: rawCta.showMenu === true,
                  alternatives: Array.isArray(rawCta.alternatives) ? rawCta.alternatives : [],
              }
            : null;

    return {
        visible: true,
        message: usageLimits.message,
        secondaryText: usageLimits.secondaryText ?? '',
        icon,
        percent: typeof usageLimits.percent === 'number' ? usageLimits.percent : 0,
        severity,
        cta,
        dismissible: usageLimits.dismissible === true,
        onDismiss: usageLimits.dismissible === true ? onDismiss : undefined,
        onSelectCta: cta ? onSelectCta : undefined,
    };
}
