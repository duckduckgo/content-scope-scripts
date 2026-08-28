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
 *   dismissible: boolean,
 *   onDismiss: (() => void) | undefined,
 * }}
 */
export function useUsageLimitsDrawer() {
    const { state, dismissUsageLimits } = useContext(OmnibarContext);
    const usageLimits = state.config?.usageLimits ?? null;

    const onDismiss = useCallback(() => {
        dismissUsageLimits();
    }, [dismissUsageLimits]);

    if (!usageLimits) {
        return {
            visible: false,
            message: '',
            secondaryText: '',
            icon: /** @type {const} */ ('info'),
            percent: 0,
            severity: /** @type {const} */ ('neutral'),
            dismissible: false,
            onDismiss: undefined,
        };
    }

    const icon = usageLimits.icon === 'ring' || usageLimits.icon === 'alert' ? usageLimits.icon : 'info';
    const severity =
        usageLimits.severity === 'warning' || usageLimits.severity === 'critical' ? usageLimits.severity : 'neutral';

    return {
        visible: true,
        message: usageLimits.message,
        secondaryText: usageLimits.secondaryText ?? '',
        icon,
        percent: typeof usageLimits.percent === 'number' ? usageLimits.percent : 0,
        severity,
        dismissible: usageLimits.dismissible === true,
        onDismiss: usageLimits.dismissible === true ? onDismiss : undefined,
    };
}
