import { h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';
import styles from './NoticeDrawer.module.css';

const SHORTCUT_TOKEN = '{shortcut}';

/**
 * Reads the native-driven launcher promo drawer presentation from OmnibarConfig.
 *
 * @returns {import('./NoticeDrawer.js').NoticePresentation | null}
 */
export function useLauncherPromoNotice() {
    const { state, selectLauncherPromoCta, dismissLauncherPromo } = useContext(OmnibarContext);
    const launcherPromo = state.config?.launcherPromo ?? null;
    const kind = launcherPromo?.kind;

    const onDismiss = useCallback(() => {
        if (kind) dismissLauncherPromo(kind);
    }, [kind, dismissLauncherPromo]);

    const onSelectCta = useCallback(() => {
        if (kind) selectLauncherPromoCta(kind);
    }, [kind, selectLauncherPromoCta]);

    if (!launcherPromo?.message) {
        return null;
    }

    const { message, shortcut, ctaLabel } = launcherPromo;
    const tokenIndex = message.indexOf(SHORTCUT_TOKEN);
    const content =
        tokenIndex === -1 || !shortcut ? (
            message
        ) : (
            <span>
                {message.slice(0, tokenIndex)}
                <kbd class={styles.shortcut}>{shortcut}</kbd>
                {message.slice(tokenIndex + SHORTCUT_TOKEN.length)}
            </span>
        );

    return {
        message: content,
        secondaryText: '',
        icon: 'info',
        cta: ctaLabel ? { label: ctaLabel, showMenu: false } : null,
        onSelectCta: ctaLabel ? onSelectCta : undefined,
        onDismiss: launcherPromo.dismissible === true ? onDismiss : undefined,
    };
}
