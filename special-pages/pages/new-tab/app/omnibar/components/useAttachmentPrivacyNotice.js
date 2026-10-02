import { useContext, useEffect } from 'preact/hooks';
import { useTypedTranslationWith } from '../../types';
import { OmnibarContext } from './OmnibarProvider';
import { AttachmentPrivacyGrant } from './PersistentOmnibarValuesProvider.js';
import { useAttachmentsContext } from './chat-tools/attachments/AttachmentsProvider';

/** @typedef {typeof import('../strings.json')} Strings */

/** @returns {import('./NoticeDrawer.js').NoticePresentation | null} */
export function useAttachmentPrivacyNotice() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { state, attachmentPrivacyDisclaimerShown, openAttachmentPrivacyLearnMore } = useContext(OmnibarContext);
    const { imageState, fileState, tabId } = useAttachmentsContext();
    const allowed = state.config?.showAttachmentPrivacyDisclaimer === true;
    const [granted, setGranted] = AttachmentPrivacyGrant.useStateWithLocalPersistence(tabId);
    /** @type {'image' | 'file' | null} */
    let attachmentKind = null;
    if (imageState.attachedImages.length > 0) {
        attachmentKind = 'image';
    } else if (fileState.attachedFiles.length > 0) {
        attachmentKind = 'file';
    }

    useEffect(() => {
        if (attachmentKind === null) {
            if (granted) setGranted(false);
            return;
        }
        if (granted || !allowed) return;
        setGranted(true);
        attachmentPrivacyDisclaimerShown(attachmentKind);
    }, [attachmentKind, granted, allowed, setGranted, attachmentPrivacyDisclaimerShown]);

    const messageValues = {
        button: {
            click: () => {
                // Non-null whenever the notice is on screen; the presentation below needs it too.
                if (attachmentKind) openAttachmentPrivacyLearnMore(attachmentKind);
            },
        },
    };

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
