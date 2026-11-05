import { h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { TextPastedColorIcon } from '../../../../components/Icons';
import { AttachmentChip } from '../attachments/AttachmentChip';
import { textPastedExcerpt, textPastedSummary } from './textPasted.js';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('./useTextPasted').AttachedTextPasted} AttachedTextPasted
 */

/**
 * @param {object} props
 * @param {AttachedTextPasted} props.textPasted
 * @param {() => void} props.onRemove
 * @param {number} [props.enteringAnimationDelay]
 */
export function TextPastedChip({ textPasted, onRemove, enteringAnimationDelay }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const summary = textPastedSummary(textPasted.content);
    return (
        <AttachmentChip
            attachmentKind="text"
            icon={<TextPastedColorIcon width={16} height={16} aria-hidden="true" />}
            title={textPastedExcerpt(textPasted.content)}
            typeLabel={t('omnibar_pastedTextLabel')}
            tooltipLabel={summary || t('omnibar_pastedTextLabel')}
            onRemove={onRemove}
            removeLabel={summary ? t('omnibar_removePastedTextLabel', { summary }) : t('omnibar_removePastedTextFallbackLabel')}
            enteringAnimationDelay={enteringAnimationDelay}
        />
    );
}
