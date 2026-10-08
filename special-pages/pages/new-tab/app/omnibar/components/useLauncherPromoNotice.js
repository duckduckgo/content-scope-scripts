import { useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';

/**
 * Reads the native-driven launcher promo drawer presentation from OmnibarConfig.
 *
 * @returns {import('./NoticeDrawer.js').NoticePresentation | null}
 */
export function useLauncherPromoNotice() {
    const { state, selectLauncherPromoCta, dismissLauncherPromo } = useContext(OmnibarContext);
    const launcherPromo = state.config?.launcherPromo ?? null;

    if (!launcherPromo) {
        return null;
    }

    return {
        type: 'informational',
        message: launcherPromo.message,
        secondaryText: launcherPromo.secondaryText ?? '',
        icon: 'announce',
        cta: launcherPromo.ctaLabel ? { label: launcherPromo.ctaLabel, showMenu: false } : null,
        onSelectCta: launcherPromo.ctaLabel ? selectLauncherPromoCta : undefined,
        onDismiss: launcherPromo.dismissible === true ? dismissLauncherPromo : undefined,
    };
}
