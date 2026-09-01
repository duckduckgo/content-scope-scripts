import { useCallback, useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';

/**
 * Reads the native-driven drawer presentation from OmnibarConfig. A Create
 * Image model-switch notice wins visually over usage limits, matching the
 * native input priority, while usage-limit prompt blocking remains enforced.
 *
 * @returns {{
 *   visible: boolean,
 *   message: string,
 *   secondaryText: string,
 *   secondaryOnNewLine: boolean,
 *   icon: 'info' | 'ring' | 'alert' | 'convert',
 *   percent: number,
 *   severity: 'neutral' | 'warning' | 'critical',
 *   cta: import('./UsageLimitsDrawer.js').UsageLimitsCta | null,
 *   blocksPrompt: boolean,
 *   dismissible: boolean,
 *   onDismiss: (() => void) | undefined,
 *   onSelectCta: ((modelId?: string) => void) | undefined,
 * }}
 */
export function useUsageLimitsDrawer() {
    const { state, dismissCreateImageModelSwitch, dismissUsageLimits, selectUsageLimitsCta } = useContext(OmnibarContext);
    const createImageModelSwitch = state.config?.createImageModelSwitch ?? null;
    const usageLimits = state.config?.usageLimits ?? null;
    const presentation = createImageModelSwitch ?? usageLimits;
    const showingCreateImageModelSwitch = createImageModelSwitch !== null;

    const onDismiss = useCallback(() => {
        if (showingCreateImageModelSwitch) {
            dismissCreateImageModelSwitch();
        } else {
            dismissUsageLimits();
        }
    }, [dismissCreateImageModelSwitch, dismissUsageLimits, showingCreateImageModelSwitch]);

    const onSelectCta = useCallback(
        (/** @type {string | undefined} */ modelId) => {
            selectUsageLimitsCta(modelId);
        },
        [selectUsageLimitsCta],
    );

    if (!presentation) {
        return {
            visible: false,
            message: '',
            secondaryText: '',
            secondaryOnNewLine: false,
            icon: /** @type {const} */ ('info'),
            percent: 0,
            severity: /** @type {const} */ ('neutral'),
            cta: null,
            blocksPrompt: usageLimits?.blocksPrompt === true,
            dismissible: false,
            onDismiss: undefined,
            onSelectCta: undefined,
        };
    }

    const icon = showingCreateImageModelSwitch
        ? /** @type {const} */ ('convert')
        : usageLimits?.icon === 'ring' || usageLimits?.icon === 'alert'
          ? usageLimits.icon
          : /** @type {const} */ ('info');
    const severity = usageLimits?.severity === 'warning' || usageLimits?.severity === 'critical' ? usageLimits.severity : 'neutral';

    const rawCta = showingCreateImageModelSwitch ? null : (usageLimits?.cta ?? null);
    const dismissible = showingCreateImageModelSwitch
        ? createImageModelSwitch?.dismissible !== false
        : usageLimits?.dismissible === true;
    /** @type {import('./UsageLimitsDrawer.js').UsageLimitsCta | null} */
    const cta =
        rawCta && typeof rawCta.label === 'string'
            ? {
                  label: rawCta.label,
                  leadingIcon: rawCta.leadingIcon === 'convert' ? 'convert' : 'none',
                  primaryModelId: rawCta.primaryModelId,
                  showMenu: rawCta.showMenu === true,
                  menuHeader: typeof rawCta.menuHeader === 'string' ? rawCta.menuHeader : undefined,
                  alternatives: Array.isArray(rawCta.alternatives)
                      ? rawCta.alternatives.filter((alt) => alt && typeof alt.id === 'string' && typeof alt.name === 'string')
                      : [],
              }
            : null;

    return {
        visible: true,
        message: presentation.message,
        secondaryText: presentation.secondaryText ?? '',
        secondaryOnNewLine: showingCreateImageModelSwitch,
        icon,
        percent: typeof usageLimits?.percent === 'number' ? usageLimits.percent : 0,
        severity,
        cta,
        blocksPrompt: usageLimits?.blocksPrompt === true,
        dismissible,
        onDismiss: dismissible ? onDismiss : undefined,
        onSelectCta: cta ? onSelectCta : undefined,
    };
}
