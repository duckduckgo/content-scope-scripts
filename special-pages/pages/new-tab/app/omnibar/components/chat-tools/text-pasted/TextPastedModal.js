import { Fragment, h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import { useMessaging, useTypedTranslationWith } from '../../../../types';
import { usePlatformName } from '../../../../settings.provider';
import { Check16Icon, Close16Icon } from '../../../../components/Icons';
import { isConvertibleTextPaste } from './textPasted.js';
import styles from './TextPastedModal.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 */

/**
 * "Pasted Text" dialog opened from a pasted-text chip: the paste in an editable textarea.
 * Edits are staged locally and only committed on "Save Changes"; Cancel, the close button,
 * Escape and backdrop clicks discard them. Mounted only while open, so the draft re-seeds per open
 * and `omnibar_pasted_text_dialog_opened` is sent once per open.
 *
 * @param {object} props
 * @param {string} props.content
 * @param {number} props.otherPromptLength - the typed text plus every other paste, which share the limit with this one.
 * @param {number} props.maxCharacters
 * @param {(content: string) => void} props.onSave
 * @param {() => void} props.onClose
 */
export function TextPastedModal({ content, otherPromptLength, maxCharacters, onSave, onClose }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const ntp = useMessaging();
    const [draft, setDraft] = useState(content);

    const dialogRef = useRef(/** @type {HTMLDialogElement|null} */ (null));
    const textareaRef = useRef(/** @type {HTMLTextAreaElement|null} */ (null));

    useEffect(() => {
        dialogRef.current?.showModal();
        textareaRef.current?.focus();
        ntp.telemetryEvent({ attributes: { name: 'omnibar_pasted_text_dialog_opened' } });
    }, [ntp]);

    const totalLength = otherPromptLength + draft.length;
    const tooLong = totalLength > maxCharacters;
    // A blank paste would never have been attached, so it can't be saved either.
    const canSave = !tooLong && isConvertibleTextPaste(draft, 1);

    const handleSave = () => {
        if (!canSave) return;
        // Saving unchanged text isn't an edit.
        if (draft !== content) onSave(draft);
        onClose();
    };

    const cancelButton = (
        <button type="button" class={cn(styles.footerButton, styles.footerButtonSecondary)} onClick={onClose}>
            {t('omnibar_pastedTextModalCancel')}
        </button>
    );
    const saveButton = (
        <button type="button" class={cn(styles.footerButton, styles.footerButtonPrimary)} disabled={!canSave} onClick={handleSave}>
            <Check16Icon aria-hidden="true" />
            {t('omnibar_pastedTextModalSave')}
        </button>
    );

    // Native <dialog> + showModal(), as AttachTabsModal: the top layer escapes the omnibar's
    // backdrop-filter containing block. data-text-pasted-modal lets the omnibar ignore its textarea
    // for focus styling and the recent-chats list.
    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="text-pasted-modal-title"
            class={styles.modal}
            data-text-pasted-modal
            onClick={(e) => {
                // Clicks on the ::backdrop are dispatched on the <dialog> itself.
                if (e.target === e.currentTarget) onClose();
            }}
            onCancel={(e) => {
                // Route native Escape-close through onClose so open/close state stays in sync.
                e.preventDefault();
                onClose();
            }}
            // The dialog renders inside the omnibar form; keep drops in the textarea from becoming attachments.
            onDragEnter={(e) => e.stopPropagation()}
            onDragOver={(e) => e.stopPropagation()}
            onDrop={(e) => e.stopPropagation()}
        >
            <header class={styles.header}>
                <h4 id="text-pasted-modal-title">{t('omnibar_pastedTextModalTitle')}</h4>
                <button type="button" class={styles.closeButton} aria-label={t('omnibar_pastedTextModalClose')} onClick={onClose}>
                    <Close16Icon aria-hidden="true" />
                </button>
            </header>
            <p class={styles.note}>{t('omnibar_pastedTextModalFormattingNote')}</p>
            <textarea
                ref={textareaRef}
                class={cn(styles.textarea, tooLong && styles.textareaInvalid)}
                value={draft}
                aria-label={t('omnibar_pastedTextModalTitle')}
                aria-invalid={tooLong || undefined}
                aria-describedby="text-pasted-modal-count"
                onInput={(e) => setDraft(/** @type {HTMLTextAreaElement} */ (e.currentTarget).value)}
            />
            <footer class={styles.footer}>
                <p id="text-pasted-modal-count" class={styles.count} aria-live="polite">
                    {tooLong ? (
                        <Fragment>
                            <span class={styles.countError}>
                                {t('omnibar_pastedTextModalTooLong')} {totalLength}
                            </span>{' '}
                            / {maxCharacters}
                        </Fragment>
                    ) : (
                        t('omnibar_pastedTextModalCharacterCount', { count: String(draft.length) })
                    )}
                </p>
                <div class={styles.footerButtons}>
                    {platformName === 'windows' ? (
                        <Fragment>
                            {saveButton}
                            {cancelButton}
                        </Fragment>
                    ) : (
                        <Fragment>
                            {cancelButton}
                            {saveButton}
                        </Fragment>
                    )}
                </div>
            </footer>
        </dialog>
    );
}
