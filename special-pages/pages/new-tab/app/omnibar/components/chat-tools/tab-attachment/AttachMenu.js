import { h } from 'preact';
import { useContext, useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../../../types';
import { CameraIcon, FolderIcon, MonitorIcon, PaperclipIcon, ScissorsIcon, TabContentAttachIcon } from '../../../../components/Icons';
import { useDropdown } from '../useDropdown';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
import { DropdownSeparator } from '../dropdown/DropdownSeparator';
import { DropdownSubmenu } from '../dropdown/DropdownSubmenu';
import { resolveFileInput } from './fileChannels';
import { OpenTabsContext } from './OpenTabsProvider';
import { AttachTabsModal } from './AttachTabsModal';
import { TabRow, TabStatusRow, TabsSectionHeader } from './TabRows';
import { Tooltip } from '../../Tooltip';
import imageStyles from '../image-attachment/ImageAttachment.module.css';
import styles from './AttachMenu.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('./fileChannels.js').ImageChannel} ImageChannel
 * @typedef {import('./fileChannels.js').FileChannel} FileChannel
 * @typedef {import('./fileChannels.js').ResolvedFileInput} ResolvedFileInput
 * @typedef {import('../../../../../types/new-tab.js').ScreenshotMode} ScreenshotMode
 * @typedef {{ modes: ScreenshotMode[], onCapture: (mode: ScreenshotMode) => void, disabled: boolean }} ScreenshotChannel
 */

/** Tabs previewed inline in the dropdown; the full list lives in the Add Tabs dialog. */
const MAX_INLINE_RECENT_TABS = 5;

/** Places the screenshot submenu against the "Add Screenshot" row. */
const SCREENSHOT_SUBMENU_OFFSET = { x: -7, y: -4 };

/**
 * @param {object} props
 * @param {ImageChannel | null} props.image — null omits the image route.
 * @param {FileChannel | null} props.file — null omits the file route.
 * @param {boolean} props.tabsEnabled
 * @param {(tab: TabMetadata) => void} props.onToggleTab
 * @param {(tabId: string) => boolean} props.isAttached
 * @param {number} [props.maxTabs] - Max attached tabs, from native `attachmentLimits.tabs.maxAttached`. Absent means no limit.
 * @param {boolean} [props.disabled] - When true, the attach entry is inert (hard usage limit).
 * @param {ScreenshotChannel | null} [props.screenshot] - Adds the "Add Screenshot" submenu; null omits it.
 */
export function AttachMenu({ image, file, tabsEnabled, onToggleTab, isAttached, maxTabs, disabled = false, screenshot = null }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const attachEnabled = image !== null || file !== null;
    if (!attachEnabled && !tabsEnabled && !screenshot) return null;

    const fileInput = resolveFileInput({ t, image, file });
    const controlsDisabled = disabled || fileInput.disabled;

    // Without tabs or screenshots there is only the file picker, so skip the dropdown.
    if (attachEnabled && !tabsEnabled && !screenshot) {
        const button = (
            <DirectFileButton
                ariaLabel={fileInput.label}
                accept={fileInput.accept}
                disabled={controlsDisabled}
                onChange={fileInput.onChange}
            />
        );
        // Image-only: a disabled button means the image limit is reached — show its warning tooltip.
        // Skip the tooltip when the whole composer is frozen by a hard usage limit.
        if (image && !file && fileInput.disabled && !disabled) {
            return (
                <Tooltip content={t('omnibar_imageAttachmentLimitWarning', { limit: String(image.maxImages) })} position="above">
                    {button}
                </Tooltip>
            );
        }
        return button;
    }

    return (
        <DropdownMenu
            attachEnabled={attachEnabled}
            fileInput={fileInput}
            onToggleTab={onToggleTab}
            isAttached={isAttached}
            maxTabs={maxTabs}
            disabled={disabled}
            tabsEnabled={tabsEnabled}
            screenshot={screenshot}
        />
    );
}

/**
 * A `<label>` wrapping a hidden file input — used when tabs are off, so no dropdown is needed.
 *
 * @param {object} props
 * @param {string} props.ariaLabel
 * @param {string} props.accept
 * @param {boolean} props.disabled
 * @param {(event: Event) => void} props.onChange
 */
function DirectFileButton({ ariaLabel, accept, disabled, onChange }) {
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));

    return (
        <label
            class={cn(imageStyles.toolButton, { [imageStyles.toolButtonDisabled]: disabled })}
            aria-label={ariaLabel}
            aria-disabled={disabled}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={(e) => {
                e.stopPropagation();
                if (disabled) e.preventDefault();
            }}
            onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                }
            }}
        >
            <PaperclipIcon />
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple
                aria-hidden="true"
                tabIndex={-1}
                disabled={disabled}
                class={imageStyles.hiddenFileInput}
                onChange={onChange}
            />
        </label>
    );
}

/**
 * Paperclip-triggered dropdown, used whenever tabs or screenshots are enabled. Owns the Add Tabs
 * dialog state, which must outlive the (unmounted-on-close) dropdown body.
 *
 * @param {object} props
 * @param {boolean} props.attachEnabled
 * @param {ResolvedFileInput} props.fileInput
 * @param {(tab: TabMetadata) => void} props.onToggleTab
 * @param {(tabId: string) => boolean} props.isAttached
 * @param {number} [props.maxTabs]
 * @param {boolean} [props.disabled]
 * @param {boolean} props.tabsEnabled
 * @param {ScreenshotChannel | null} props.screenshot
 */
function DropdownMenu({ attachEnabled, fileInput, onToggleTab, isAttached, maxTabs, disabled = false, tabsEnabled, screenshot }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { isOpen, buttonRef, dropdownRef, dropdownPos, toggle, close } = useDropdown({ align: 'left' });
    const { refetchTabs } = useContext(OpenTabsContext);
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));
    const [isTabsModalOpen, setIsTabsModalOpen] = useState(false);

    const triggerFileInput = () => {
        if (disabled || fileInput.disabled) return;
        window.setTimeout(() => fileInputRef.current?.click(), 0);
    };

    const handleClose = ({ restoreFocus }) => {
        close();
        if (restoreFocus) buttonRef.current?.focus();
    };

    return (
        <div class={styles.attachMenu}>
            <button
                ref={buttonRef}
                type="button"
                tabIndex={disabled ? -1 : 0}
                class={cn(imageStyles.toolButton, disabled && imageStyles.toolButtonDisabled)}
                aria-label={t('omnibar_attachMenuLabel')}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                disabled={disabled}
                onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    if (!isOpen && tabsEnabled) refetchTabs();
                    toggle();
                }}
            >
                <PaperclipIcon />
            </button>
            {attachEnabled && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={fileInput.accept}
                    multiple
                    aria-hidden="true"
                    tabIndex={-1}
                    disabled={fileInput.disabled}
                    class={imageStyles.hiddenFileInput}
                    onChange={fileInput.onChange}
                />
            )}
            {isOpen && dropdownPos && (
                <OpenDropdownBody
                    attachEnabled={attachEnabled}
                    fileLabel={fileInput.label}
                    dropdownPos={dropdownPos}
                    dropdownRef={dropdownRef}
                    onClose={handleClose}
                    onTriggerFileInput={triggerFileInput}
                    onOpenTabsModal={() => setIsTabsModalOpen(true)}
                    isAttached={isAttached}
                    onToggleTab={onToggleTab}
                    tabsEnabled={tabsEnabled}
                    screenshot={screenshot}
                />
            )}
            {isTabsModalOpen && (
                <AttachTabsModal
                    onClose={() => setIsTabsModalOpen(false)}
                    onToggleTab={onToggleTab}
                    isAttached={isAttached}
                    maxTabs={maxTabs}
                />
            )}
        </div>
    );
}

/**
 * Body of the paperclip menu while open: file item, "Add Screenshot" submenu, "Add Tabs" item
 * (opens the dialog), and an inline "Recent Tabs" preview whose rows toggle attachment. The
 * checkmark gutter is only reserved while at least one previewed tab is attached.
 *
 * @param {object} props
 * @param {boolean} props.attachEnabled
 * @param {string} props.fileLabel
 * @param {import('../useDropdown.js').DropdownPosition} props.dropdownPos
 * @param {import('preact').RefObject<HTMLUListElement>} props.dropdownRef
 * @param {(opts: { restoreFocus: boolean }) => void} props.onClose
 * @param {() => void} props.onTriggerFileInput
 * @param {() => void} props.onOpenTabsModal
 * @param {(tab: TabMetadata) => void} props.onToggleTab
 * @param {(tabId: string) => boolean} props.isAttached
 * @param {boolean} props.tabsEnabled
 * @param {ScreenshotChannel | null} props.screenshot
 */
function OpenDropdownBody({
    attachEnabled,
    fileLabel,
    dropdownPos,
    dropdownRef,
    onClose,
    onTriggerFileInput,
    onOpenTabsModal,
    onToggleTab,
    isAttached,
    tabsEnabled,
    screenshot,
}) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { openTabs, isLoadingTabs } = useContext(OpenTabsContext);

    const recentTabs = openTabs.slice(0, MAX_INLINE_RECENT_TABS);
    const showGutter = tabsEnabled && recentTabs.some((tab) => isAttached(tab.tabId));
    const noTabsAvailable = !isLoadingTabs && openTabs.length === 0;

    /** @returns {import('preact').ComponentChildren[]} */
    const renderRecentTabRows = () => {
        if (isLoadingTabs) {
            return [<TabStatusRow key="loading" text={t('omnibar_attachTabsLoading')} />];
        }
        if (recentTabs.length === 0) {
            return [<TabStatusRow key="empty" text={t('omnibar_attachTabsNoPageContent')} />];
        }
        return recentTabs.map((tab) => (
            <TabRow
                key={tab.tabId}
                tab={tab}
                showGutter={showGutter}
                isAttached={isAttached(tab.tabId)}
                onSelect={() => onToggleTab(tab)}
            />
        ));
    };

    return (
        <Dropdown
            dropdownRef={dropdownRef}
            role="menu"
            ariaLabel={t('omnibar_attachMenuLabel')}
            position={dropdownPos}
            onClose={onClose}
            idPrefix="attach-menu-item"
            className={styles.attachDropdown}
        >
            {attachEnabled && (
                <DropdownItem
                    role="menuitem"
                    className={styles.menuItem}
                    showCheckGutter={showGutter}
                    icon={<FolderIcon class={styles.menuItemIcon} />}
                    name={fileLabel}
                    onSelect={onTriggerFileInput}
                />
            )}
            {screenshot && (
                <DropdownSubmenu
                    className={styles.menuItem}
                    showCheckGutter={showGutter}
                    icon={<CameraIcon class={styles.menuItemIcon} />}
                    name={t('omnibar_addScreenshotLabel')}
                    ariaLabel={t('omnibar_addScreenshotLabel')}
                    disabled={screenshot.disabled}
                    panelClassName={styles.attachDropdown}
                    offset={SCREENSHOT_SUBMENU_OFFSET}
                    idPrefix="screenshot-menu-item"
                >
                    {screenshot.modes.map((mode) => (
                        <DropdownItem
                            key={mode}
                            role="menuitem"
                            className={styles.menuItem}
                            showCheckGutter={false}
                            icon={
                                mode === 'dragToSelect' ? (
                                    <ScissorsIcon class={styles.menuItemIcon} />
                                ) : (
                                    <MonitorIcon class={styles.menuItemIcon} />
                                )
                            }
                            name={
                                mode === 'dragToSelect'
                                    ? t('omnibar_screenshotDragToSelectLabel')
                                    : t('omnibar_screenshotSelectWindowOrDisplayLabel')
                            }
                            onSelect={() => screenshot.onCapture(mode)}
                        />
                    ))}
                </DropdownSubmenu>
            )}
            {tabsEnabled && (
                <DropdownItem
                    role="menuitem"
                    className={styles.menuItem}
                    showCheckGutter={showGutter}
                    icon={<TabContentAttachIcon class={styles.menuItemIcon} />}
                    name={t('omnibar_attachPageContentLabel')}
                    disabled={noTabsAvailable}
                    onSelect={onOpenTabsModal}
                />
            )}
            {tabsEnabled && <DropdownSeparator />}
            {tabsEnabled && recentTabs.length > 0 && (
                <TabsSectionHeader label={t('omnibar_attachTabsRecentTabs')} showGutter={showGutter} />
            )}
            {tabsEnabled && renderRecentTabRows()}
        </Dropdown>
    );
}
