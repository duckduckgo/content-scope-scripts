import { useCallback, useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';

/**
 * Reads the native-driven usageLimits presentation from OmnibarConfig.
 * Tracer: message + optional secondary + dismiss only.
 *
 * @returns {{
 *   visible: boolean,
 *   message: string,
 *   secondaryText: string,
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
            dismissible: false,
            onDismiss: undefined,
        };
    }

    return {
        visible: true,
        message: usageLimits.message,
        secondaryText: usageLimits.secondaryText ?? '',
        dismissible: usageLimits.dismissible === true,
        onDismiss: usageLimits.dismissible === true ? onDismiss : undefined,
    };
}
