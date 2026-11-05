import { h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { AttachmentChip } from '../attachments/AttachmentChip';
import { getDomainForDisplay } from '../attachments/attachmentText';
import { TabFavicon } from './TabFavicon';
import styles from './TabChips.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('./useTabAttachments').AttachedTab} AttachedTab
 * @typedef {import('../attachments/AttachmentChips').ChipItem} ChipItem
 */

/**
 * @param {AttachedTab[]} tabs
 * @param {(tabId: string) => void} onRemove
 * @param {(key: string, params?: Record<string, string>) => string} t
 * @returns {ChipItem[]}
 */
export function tabChipItems(tabs, onRemove, t) {
    return tabs.map((tab) => ({
        key: `tab-${tab.tabId}`,
        addedAtRelative: tab.addedAtRelative,
        render: (enteringAnimationDelay) => (
            <TabChip
                tab={tab}
                onRemove={() => onRemove(tab.tabId)}
                removeLabel={t('omnibar_removeAttachedTabLabel', { title: tab.title })}
                enteringAnimationDelay={enteringAnimationDelay}
            />
        ),
    }));
}

/**
 * @param {object} props
 * @param {TabMetadata} props.tab
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 * @param {number} [props.enteringAnimationDelay]
 */
export function TabChip({ tab, onRemove, removeLabel, enteringAnimationDelay }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    return (
        <AttachmentChip
            attachmentKind="tab"
            icon={<TabFavicon favicon={tab.favicon} iconSize={16} className={styles.favicon} fallbackClassName={styles.faviconFallback} />}
            title={tab.title}
            typeLabel={t('omnibar_attachmentTypeWebpage')}
            metadata={getDomainForDisplay(tab.url)}
            onRemove={onRemove}
            removeLabel={removeLabel}
            enteringAnimationDelay={enteringAnimationDelay}
        />
    );
}
