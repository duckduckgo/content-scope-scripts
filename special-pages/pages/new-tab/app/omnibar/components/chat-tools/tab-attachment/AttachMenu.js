import { Fragment, h } from 'preact';
import { useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../../../types';
import { ChevronSmall, FolderIcon, PageContentIcon, PaperclipIcon } from '../../../../components/Icons';
import { useDropdown } from '../useDropdown';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
import { resolveFileInput } from './fileChannels';
import { TabPicker } from './TabPicker';
import { Tooltip } from '../../Tooltip';
import imageStyles from '../image-attachment/ImageAttachment.module.css';
import styles from './AttachMenu.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('./fileChannels.js').ImageChannel} ImageChannel
 * @typedef {import('./fileChannels.js').FileChannel} FileChannel
 * @typedef {import('./fileChannels.js').ResolvedFileInput} ResolvedFileInput
 */

/**
 * @param {object} props
 * @param {ImageChannel | null} props.image — null omits the image route.
 * @param {FileChannel | null} props.file — null omits the file route.
 * @param {boolean} props.tabsEnabled
 * @param {(tab: TabMetadata) => void} props.onToggleTab
 * @param {(tabId: string) => boolean} props.isAttached
 */
export function AttachMenu({ image, file, tabsEnabled, onToggleTab, isAttached }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const attachEnabled = image !== null || file !== null;
    if (!attachEnabled && !tabsEnabled) return null;

    const fileInput = resolveFileInput({ t, image, file });

    if (attachEnabled && !tabsEnabled) {
        const button = (
            <DirectFileButton
                ariaLabel={fileInput.label}
                accept={fileInput.accept}
                disabled={fileInput.disabled}
                onChange={fileInput.onChange}
            />
        );
        // Image-only: a disabled button means the image limit is reached — show its warning tooltip.
        if (image && !file && fileInput.disabled) {
            return (
                <Tooltip content={t('omnibar_imageAttachmentLimitWarning', { limit: String(image.maxImages) })} position="above">
                    {button}
                </Tooltip>
            );
        }
        return button;
    }

    return <DropdownMenu attachEnabled={attachEnabled} fileInput={fileInput} onToggleTab={onToggleTab} isAttached={isAttached} />;
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
 * Paperclip-triggered dropdown, used whenever `tabsEnabled`. The hidden file input is
 * `click()`-triggered on a microtask so the menu unmounts before the OS picker takes focus.
 *
 * @param {object} props
 * @param {boolean} props.attachEnabled
 * @param {ResolvedFileInput} props.fileInput
 * @param {(tab: TabMetadata) => void} props.onToggleTab
 * @param {(tabId: string) => boolean} props.isAttached
 */
function DropdownMenu({ attachEnabled, fileInput, onToggleTab, isAttached }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { isOpen, buttonRef, dropdownRef, dropdownPos, toggle, close } = useDropdown({ align: 'left' });
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));

    const triggerFileInput = () => {
        if (fileInput.disabled) return;
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
                tabIndex={0}
                class={imageStyles.toolButton}
                aria-label={t('omnibar_attachMenuLabel')}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={(e) => {
                    e.stopPropagation();
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
                    isAttached={isAttached}
                    onToggleTab={(tab) => {
                        onToggleTab(tab);
                        close();
                    }}
                />
            )}
        </div>
    );
}

/**
 * Body of the paperclip menu while open. Mounted only while open, so `submenuOpen` resets on re-open.
 *
 * @param {object} props
 * @param {boolean} props.attachEnabled
 * @param {string} props.fileLabel
 * @param {import('../useDropdown.js').DropdownPosition} props.dropdownPos
 * @param {import('preact').RefObject<HTMLUListElement>} props.dropdownRef
 * @param {(opts: { restoreFocus: boolean }) => void} props.onClose
 * @param {() => void} props.onTriggerFileInput
 * @param {(tab: TabMetadata) => void} props.onToggleTab
 * @param {(tabId: string) => boolean} props.isAttached
 */
function OpenDropdownBody({ attachEnabled, fileLabel, dropdownPos, dropdownRef, onClose, onTriggerFileInput, onToggleTab, isAttached }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const submenuRef = useRef(/** @type {HTMLUListElement|null} */ (null));
    const triggerRef = useRef(/** @type {HTMLLIElement|null} */ (null));
    const [submenuOpen, setSubmenuOpen] = useState(false);

    const getSubmenuPos = () => {
        if (!submenuOpen || dropdownPos.left === undefined || !dropdownRef.current) return null;
        // Align the submenu to its triggering item, not the top of the parent panel.
        const triggerOffsetTop = triggerRef.current?.offsetTop ?? 0;
        return {
            left: dropdownPos.left + dropdownRef.current.offsetWidth + 4,
            top: dropdownPos.top + triggerOffsetTop,
        };
    };
    const submenuPos = getSubmenuPos();

    return (
        <Fragment>
            <Dropdown
                dropdownRef={dropdownRef}
                role="menu"
                ariaLabel={t('omnibar_attachMenuLabel')}
                position={dropdownPos}
                onClose={onClose}
                idPrefix="attach-menu-item"
            >
                {attachEnabled && (
                    <DropdownItem
                        role="menuitem"
                        icon={<FolderIcon />}
                        name={fileLabel}
                        onSelect={onTriggerFileInput}
                        onHover={() => setSubmenuOpen(false)}
                    />
                )}
                <DropdownItem
                    role="menuitem"
                    elementRef={triggerRef}
                    ariaHasPopup
                    ariaExpanded={submenuOpen}
                    icon={<PageContentIcon />}
                    name={t('omnibar_attachPageContentLabel')}
                    trailingIcon={
                        <span class={styles.submenuChevron} aria-hidden="true">
                            <ChevronSmall />
                        </span>
                    }
                    onSelect={() => setSubmenuOpen(true)}
                    onHover={() => setSubmenuOpen(true)}
                />
            </Dropdown>
            {submenuPos && (
                <TabPicker
                    position={submenuPos}
                    dropdownRef={submenuRef}
                    onSelect={onToggleTab}
                    isAttached={isAttached}
                    onClose={onClose}
                />
            )}
        </Fragment>
    );
}
