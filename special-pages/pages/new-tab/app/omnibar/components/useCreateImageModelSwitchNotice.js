import { useCallback, useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';

/**
 * Reads the native-driven notice shown when Create Image switches models.
 *
 * @returns {import('./NoticeDrawer.js').NoticePresentation | null}
 */
export function useCreateImageModelSwitchNotice() {
    const { state, dismissCreateImageModelSwitch } = useContext(OmnibarContext);
    const notice = state.config?.createImageModelSwitch ?? null;

    const onDismiss = useCallback(() => {
        dismissCreateImageModelSwitch();
    }, [dismissCreateImageModelSwitch]);

    if (!notice) return null;

    return {
        message: notice.message,
        secondaryText: notice.secondaryText ?? '',
        secondaryOnNewLine: true,
        icon: /** @type {const} */ ('convert'),
        onDismiss: notice.dismissible !== false ? onDismiss : undefined,
    };
}
