import { useCallback, useContext, useEffect, useMemo } from 'preact/hooks';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { AttachmentPrivacyGrant } from './PersistentOmnibarValuesProvider.js';

/** @typedef {typeof import('../strings.json')} Strings */

/**
 * The file-upload privacy disclaimer. Native owns the device-wide display count and answers with
 * `showAttachmentPrivacyDisclaimer`; the page owns the trigger, since only it sees the attachments.
 *
 * The grant is persisted per tab, alongside the attachments: a mode switch unmounts the drawer and
 * hiding the widget unmounts the Omnibar, both while the staged attachments live on, and neither
 * may spend a second display.
 *
 * @param {'image' | 'file' | null} attachmentKind - The staged attachment, or null when there is none.
 * @param {string|null|undefined} tabId
 * @returns {{ presentation: import('./NoticeDrawer.js').NoticePresentation | null, endDraft: () => void }}
 */
export function useAttachmentPrivacyNotice(attachmentKind, tabId) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { state, attachmentPrivacyDisclaimerShown, openAttachmentPrivacyLearnMore } = useContext(OmnibarContext);
    const allowed = state.config?.showAttachmentPrivacyDisclaimer === true;
    const [granted, setGranted] = AttachmentPrivacyGrant.useStateWithLocalPersistence(tabId);

    useEffect(() => {
        if (!attachmentKind || granted || !allowed) return;
        setGranted(true);
        attachmentPrivacyDisclaimerShown(attachmentKind);
    }, [attachmentKind, granted, allowed, setGranted, attachmentPrivacyDisclaimerShown]);

    const endDraft = useCallback(() => setGranted(false), [setGranted]);

    const messageValues = useMemo(() => ({ button: { click: () => openAttachmentPrivacyLearnMore() } }), [openAttachmentPrivacyLearnMore]);

    // `granted` outlasts `allowed`: the draft that spends the last display keeps showing the message.
    const presentation =
        attachmentKind && granted
            ? {
                  message: t('omnibar_attachmentPrivacyDisclaimer'),
                  secondaryText: '',
                  icon: /** @type {const} */ ('info'),
                  messageValues,
              }
            : null;

    return { presentation, endDraft };
}
