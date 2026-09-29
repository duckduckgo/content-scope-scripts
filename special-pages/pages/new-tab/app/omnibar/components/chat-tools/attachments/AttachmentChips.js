import { h } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
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
 * @typedef {{ kind: 'tab', key: string, tab: AttachedTab, addedAtRelative: number }} TabItem
 * @typedef {{ kind: 'file', key: string, file: AttachedFile, originalIndex: number, addedAtRelative: number }} FileItem
 * @typedef {{ kind: 'image', key: string, image: AttachedImage, originalIndex: number, addedAtRelative: number }} ImageItem
 * @typedef {TabItem | FileItem | ImageItem} AttachmentItem
 */

/**
 * @param {object} props
 * @param {AttachedTab[]} props.tabs
 * @param {AttachedFile[]} props.files
 * @param {AttachedImage[]} props.images
 * @param {(tabId: string) => void} props.onRemoveTab
 * @param {(originalIndex: number) => void} props.onRemoveFile
 * @param {(originalIndex: number) => void} props.onRemoveImage
 */
export function AttachmentChips({ tabs, files, images, onRemoveTab, onRemoveFile, onRemoveImage }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    // Ordered by attach time so chips appear in the order the user attached them, not grouped by type.
    /** @type {AttachmentItem[]} */
    const items = [
        ...tabs.map((tab) => /** @type {TabItem} */ ({ kind: 'tab', key: `tab-${tab.tabId}`, tab, addedAtRelative: tab.addedAtRelative })),
        ...files.map(
            (file, originalIndex) =>
                /** @type {FileItem} */ ({
                    kind: 'file',
                    key: `file-${file.fileName}-${originalIndex}`,
                    file,
                    originalIndex,
                    addedAtRelative: file.addedAtRelative,
                }),
        ),
        ...images.map(
            (image, originalIndex) =>
                /** @type {ImageItem} */ ({
                    kind: 'image',
                    key: `image-${image.fileName}-${originalIndex}`,
                    image,
                    originalIndex,
                    addedAtRelative: image.addedAtRelative,
                }),
        ),
    ].sort((a, b) => a.addedAtRelative - b.addedAtRelative);

    // Items are in attach order, so a newly added chip is always last. useLayoutEffect
    // so the scroll happens before paint and the chip doesn't flash un-scrolled.
    const listRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const previousCount = useRef(0);
    useLayoutEffect(() => {
        const grew = items.length > previousCount.current;
        previousCount.current = items.length;
        const list = listRef.current;
        if (!grew || !list) return;
        list.lastElementChild?.scrollIntoView?.({ behavior: 'auto', inline: 'nearest', block: 'nearest' });
        list.scrollLeft = list.scrollWidth;
    }, [items.length]);

    if (items.length === 0) return null;

    return (
        <div ref={listRef} class={styles.chipsArea} data-testid="omnibar-attachment-chips">
            {items.map((item, index) => {
                const enteringAnimationDelay = index * 50;
                switch (item.kind) {
                    case 'tab':
                        return (
                            <TabChip
                                key={item.key}
                                tab={item.tab}
                                onRemove={() => onRemoveTab(item.tab.tabId)}
                                removeLabel={t('omnibar_removeAttachedTabLabel', { title: item.tab.title })}
                                enteringAnimationDelay={enteringAnimationDelay}
                            />
                        );
                    case 'file':
                        return (
                            <FileChip
                                key={item.key}
                                file={item.file}
                                onRemove={() => onRemoveFile(item.originalIndex)}
                                removeLabel={t('omnibar_removeAttachedFileLabel', { fileName: item.file.fileName })}
                                enteringAnimationDelay={enteringAnimationDelay}
                            />
                        );
                    case 'image':
                        return (
                            <ImageChip
                                key={item.key}
                                image={item.image}
                                onRemove={() => onRemoveImage(item.originalIndex)}
                                removeLabel={t('omnibar_removeImageLabel')}
                                enteringAnimationDelay={enteringAnimationDelay}
                            />
                        );
                    default: {
                        /** @type {never} */
                        const _exhaustiveCheck = item;
                        console.error(`Unknown attachment item kind: ${_exhaustiveCheck}`);
                        return null;
                    }
                }
            })}
        </div>
    );
}
