import { Fragment, h } from 'preact';
import { useState } from 'preact/hooks';
import { useTypedTranslationWith } from '../../../../types';
import { TextPastedColorIcon } from '../../../../components/Icons';
import { AttachmentChip } from '../attachments/AttachmentChip';
import { TextPastedModal } from './TextPastedModal';
import { textPastedExcerpt, textPastedSummary } from './textPasted.js';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('./useTextPasted').AttachedTextPasted} AttachedTextPasted
 */

/**
 * A pasted-text chip; opening it shows the paste in an editable dialog.
 *
 * @param {object} props
 * @param {AttachedTextPasted} props.textPasted
 * @param {() => void} props.onRemove
 * @param {(content: string) => void} props.onEdit
 * @param {number} props.promptLength - the typed text plus every paste, this one included.
 * @param {number} props.maxCharacters
 * @param {number} [props.enteringAnimationDelay]
 */
export function TextPastedChip({ textPasted, onRemove, onEdit, promptLength, maxCharacters, enteringAnimationDelay }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const summary = textPastedSummary(textPasted.content);
    return (
        <Fragment>
            <AttachmentChip
                attachmentKind="text"
                icon={<TextPastedColorIcon width={16} height={16} aria-hidden="true" />}
                title={textPastedExcerpt(textPasted.content)}
                typeLabel={t('omnibar_pastedTextLabel')}
                tooltipLabel={summary || t('omnibar_pastedTextLabel')}
                onRemove={onRemove}
                removeLabel={summary ? t('omnibar_removePastedTextLabel', { summary }) : t('omnibar_removePastedTextFallbackLabel')}
                enteringAnimationDelay={enteringAnimationDelay}
                onOpen={() => setIsModalOpen(true)}
            />
            {isModalOpen && (
                <TextPastedModal
                    content={textPasted.content}
                    otherPromptLength={promptLength - textPasted.content.length}
                    maxCharacters={maxCharacters}
                    onSave={onEdit}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </Fragment>
    );
}
