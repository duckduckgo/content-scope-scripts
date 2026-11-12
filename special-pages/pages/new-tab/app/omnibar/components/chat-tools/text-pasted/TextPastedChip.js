import { Fragment, h } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useTypedTranslationWith } from '../../../../types';
import { TextPastedColorIcon } from '../../../../components/Icons';
import { AttachmentChip } from '../attachments/AttachmentChip';
import { useLocale } from '../../../../../../../shared/components/EnvironmentProvider.js';
import { getLocalizedNumberFormatter } from '../../../../../../../shared/utils.js';
import { TextPastedModal } from './TextPastedModal';
import { textPastedExcerpt, textPastedSummary } from './textPasted.js';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('./useTextPasted').AttachedTextPasted} AttachedTextPasted
 */

/**
 * A pasted-text chip showing the paste's length; opening it shows the paste in an editable dialog.
 * While the whole prompt is over the limit, every chip's length turns red.
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
    const locale = useLocale();
    const numberFormatter = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    const summary = textPastedSummary(textPasted.content);
    return (
        <Fragment>
            <AttachmentChip
                attachmentKind="text"
                icon={<TextPastedColorIcon width={16} height={16} aria-hidden="true" />}
                title={textPastedExcerpt(textPasted.content)}
                typeLabel={t('omnibar_pastedTextLabel')}
                metadata={t('omnibar_pastedTextChipCharacterCount', { count: numberFormatter.format(textPasted.content.length) })}
                metadataInvalid={promptLength > maxCharacters}
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
