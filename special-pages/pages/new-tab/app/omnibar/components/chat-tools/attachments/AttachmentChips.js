import { h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { TabChip } from '../tab-attachment/TabChips';
import { FileChip } from '../file-attachment/FileChip';
import { ImageChip } from '../image-attachment/ImageChip';
import styles from './AttachmentChips.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('../tab-attachment/useTabAttachments').AttachedTab} AttachedTab
 * @typedef {import('../file-attachment/useFileAttachments').AttachedFile} AttachedFile
 * @typedef {import('../image-attachment/useImageAttachments').AttachedImage} AttachedImage
 *
 * @typedef {{ kind: 'tab', key: string, tab: AttachedTab }} TabItem
 * @typedef {{ kind: 'file', key: string, file: AttachedFile, index: number }} FileItem
 * @typedef {{ kind: 'image', key: string, image: AttachedImage, index: number }} ImageItem
 * @typedef {TabItem | FileItem | ImageItem} AttachmentItem
 */

/**
 * Single container for every omnibar attachment. Collects attached tabs, files,
 * and images into one flowing, wrapping row and renders each as its own
 * representation based on its `kind` — tab → page chip, file → file card,
 * image → thumbnail. Returns nothing when empty; callers should still mount it
 * so the area can appear/disappear without layout jumps.
 *
 * Image limit/error alerts and the chat-list visibility wiring live separately
 * in `ImageAttachmentContent` — this container only renders the chips.
 *
 * @param {object} props
 * @param {AttachedTab[]} props.tabs
 * @param {AttachedFile[]} props.files
 * @param {AttachedImage[]} props.images
 * @param {(tabId: string) => void} props.onRemoveTab
 * @param {(index: number) => void} props.onRemoveFile
 * @param {(index: number) => void} props.onRemoveImage
 */
export function AttachmentChips({ tabs, files, images, onRemoveTab, onRemoveFile, onRemoveImage }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    /** @type {AttachmentItem[]} */
    const items = [
        ...tabs.map((tab) => /** @type {TabItem} */ ({ kind: 'tab', key: `tab-${tab.tabId}`, tab })),
        ...files.map((file, index) => /** @type {FileItem} */ ({ kind: 'file', key: `file-${file.fileName}-${index}`, file, index })),
        ...images.map(
            (image, index) => /** @type {ImageItem} */ ({ kind: 'image', key: `image-${image.fileName}-${index}`, image, index }),
        ),
    ];

    if (items.length === 0) return null;

    return (
        <div class={styles.chipsArea} data-testid="omnibar-attachment-chips">
            {items.map((item) => {
                switch (item.kind) {
                    case 'tab':
                        return (
                            <TabChip
                                key={item.key}
                                tab={item.tab}
                                onRemove={() => onRemoveTab(item.tab.tabId)}
                                removeLabel={t('omnibar_removeAttachedTabLabel', { title: item.tab.metadata.title })}
                            />
                        );
                    case 'file':
                        return (
                            <FileChip
                                key={item.key}
                                file={item.file}
                                onRemove={() => onRemoveFile(item.index)}
                                removeLabel={t('omnibar_removeAttachedFileLabel', { fileName: item.file.fileName })}
                            />
                        );
                    case 'image':
                        return (
                            <ImageChip
                                key={item.key}
                                image={item.image}
                                onRemove={() => onRemoveImage(item.index)}
                                removeLabel={t('omnibar_removeImageLabel')}
                            />
                        );
                    default: {
                        /** @type {never} */
                        const _exhaustiveCheck = item;
                        return _exhaustiveCheck;
                    }
                }
            })}
        </div>
    );
}
