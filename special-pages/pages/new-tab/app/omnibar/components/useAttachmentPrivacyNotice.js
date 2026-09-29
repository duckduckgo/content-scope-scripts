import { useContext, useEffect, useMemo } from 'preact/hooks';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { AttachmentPrivacyGrant } from './PersistentOmnibarValuesProvider.js';

/** @typedef {typeof import('../strings.json')} Strings */

/**
 * The file-upload privacy disclaimer. Native owns the device-wide display count and answers with
 * `showAttachmentPrivacyDisclaimer`; the page owns the trigger, since only it sees the attachments.
 *
 * One display per continuous attachment session, matching iOS: emptying the attachments ends it, so
 * re-attaching spends another. The grant is persisted per tab alongside the attachments, because a
 * mode switch unmounts the drawer and hiding the widget unmounts the Omnibar, both while the staged
 * attachments live on — neither may spend a second display.
 *
 * @param {'image' | 'file' | null | undefined} attachmentKind - The staged attachment, `null` when
 * there is none, `undefined` before the composer has derived it.
 * @param {string|null|undefined} tabId
 * @returns {import('./NoticeDrawer.js').NoticePresentation | null}
 */
export function useAttachmentPrivacyNotice(attachmentKind, tabId) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { state, attachmentPrivacyDisclaimerShown, openAttachmentPrivacyLearnMore } = useContext(OmnibarContext);
    const allowed = state.config?.showAttachmentPrivacyDisclaimer === true;
    const [granted, setGranted] = AttachmentPrivacyGrant.useStateWithLocalPersistence(tabId);

    useEffect(() => {
        // Not derived yet — the Omnibar just remounted, and the attachments are still being read
        // back. Only an explicit `null` means the user emptied them.
        if (attachmentKind === undefined) return;
        if (attachmentKind === null) {
            if (granted) setGranted(false);
            return;
        }
        if (granted || !allowed) return;
        setGranted(true);
        attachmentPrivacyDisclaimerShown(attachmentKind);
    }, [attachmentKind, granted, allowed, setGranted, attachmentPrivacyDisclaimerShown]);

    const messageValues = useMemo(() => ({ button: { click: () => openAttachmentPrivacyLearnMore() } }), [openAttachmentPrivacyLearnMore]);

    // `granted` outlasts `allowed`: the display that spends the last one stays on screen.
    const presentation =
        attachmentKind && granted
            ? {
                  message: t('omnibar_attachmentPrivacyDisclaimer'),
                  secondaryText: '',
                  icon: /** @type {const} */ ('info'),
                  messageValues,
              }
            : null;

    return presentation;
}
