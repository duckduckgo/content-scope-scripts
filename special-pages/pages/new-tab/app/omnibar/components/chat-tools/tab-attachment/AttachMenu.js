import { Fragment, h } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { useTypedTranslationWith } from '../../../../types';
import { ChevronSmall, GlobeIcon, ImageIcon, PaperclipIcon, TabDesktopIcon } from '../../../../components/Icons';
import { useDropdown } from '../useDropdown';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
import { useOpenTabs } from './useOpenTabs';
import imageStyles from '../image-attachment/ImageAttachment.module.css';
import styles from './AttachMenu.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('../../../../../types/new-tab.js').Favicon} Favicon
 */

/**
 * @param {object} props
 * @param {boolean} props.imagesEnabled
 * @param {boolean} props.tabsEnabled
 * @param {boolean} props.imageUploadDisabled
 * @param {(event: Event) => void} props.onFileChange
 * @param {(tab: TabMetadata) => void} props.onAttachTab
 */
export function AttachMenu({ imagesEnabled, tabsEnabled, imageUploadDisabled, onFileChange, onAttachTab }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    if (!imagesEnabled && !tabsEnabled) return null;

    if (imagesEnabled && !tabsEnabled) {
        return <ImageOnlyButton t={t} imageUploadDisabled={imageUploadDisabled} onFileChange={onFileChange} />;
    }

    if (!imagesEnabled && tabsEnabled) {
        return <TabsOnlyMenu t={t} onAttachTab={onAttachTab} />;
    }

    return <BothModesMenu t={t} imageUploadDisabled={imageUploadDisabled} onFileChange={onFileChange} onAttachTab={onAttachTab} />;
}

/**
 * @param {object} props
 * @param {(key: keyof Strings) => string} props.t
 * @param {boolean} props.imageUploadDisabled
 * @param {(event: Event) => void} props.onFileChange
 */
function ImageOnlyButton({ t, imageUploadDisabled, onFileChange }) {
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));

    return (
        <label
            class={imageUploadDisabled ? `${imageStyles.toolButton} ${imageStyles.toolButtonDisabled}` : imageStyles.toolButton}
            aria-label={t('omnibar_attachImageLabel')}
            aria-disabled={imageUploadDisabled}
            role="button"
            tabIndex={imageUploadDisabled ? -1 : 0}
            onClick={(e) => {
                e.stopPropagation();
                if (imageUploadDisabled) e.preventDefault();
            }}
            onKeyDown={(e) => {
                if (imageUploadDisabled) return;
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
                accept="image/jpeg,image/png,image/webp"
                multiple
                aria-hidden="true"
                disabled={imageUploadDisabled}
                class={imageStyles.hiddenFileInput}
                onChange={onFileChange}
            />
        </label>
    );
}

/**
 * @param {object} props
 * @param {(key: keyof Strings) => string} props.t
 * @param {(tab: TabMetadata) => void} props.onAttachTab
 */
function TabsOnlyMenu({ t, onAttachTab }) {
    const { isOpen, buttonRef, dropdownRef, dropdownPos, toggle, close } = useDropdown({ align: 'left' });

    const handleClose = ({ restoreFocus }) => {
        close();
        if (restoreFocus) buttonRef.current?.focus();
    };

    return (
        <Fragment>
            <button
                ref={buttonRef}
                type="button"
                class={imageStyles.toolButton}
                aria-label={t('omnibar_attachTabsLabel')}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                }}
            >
                <PaperclipIcon />
            </button>
            {isOpen && dropdownPos && (
                <TabPicker
                    t={t}
                    position={dropdownPos}
                    dropdownRef={dropdownRef}
                    onSelect={(tab) => {
                        onAttachTab(tab);
                        close();
                    }}
                    onClose={handleClose}
                />
            )}
        </Fragment>
    );
}

/**
 * @param {object} props
 * @param {(key: keyof Strings) => string} props.t
 * @param {boolean} props.imageUploadDisabled
 * @param {(event: Event) => void} props.onFileChange
 * @param {(tab: TabMetadata) => void} props.onAttachTab
 */
function BothModesMenu({ t, imageUploadDisabled, onFileChange, onAttachTab }) {
    const { isOpen, buttonRef, dropdownRef, dropdownPos, toggle, close } = useDropdown({ align: 'left' });
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));

    const triggerFileInput = () => {
        if (imageUploadDisabled) return;

        window.setTimeout(() => fileInputRef.current?.click(), 0);
    };

    const handleClose = ({ restoreFocus }) => {
        close();
        if (restoreFocus) buttonRef.current?.focus();
    };

    return (
        <Fragment>
            <button
                ref={buttonRef}
                type="button"
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
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                aria-hidden="true"
                disabled={imageUploadDisabled}
                class={imageStyles.hiddenFileInput}
                onChange={onFileChange}
            />
            {isOpen && dropdownPos && (
                <OpenAttachMenu
                    t={t}
                    dropdownPos={dropdownPos}
                    dropdownRef={dropdownRef}
                    onClose={handleClose}
                    onTriggerFileInput={triggerFileInput}
                    onAttachTab={(tab) => {
                        onAttachTab(tab);
                        close();
                    }}
                />
            )}
        </Fragment>
    );
}

/**
 * Body of the paperclip menu while it's open. Mounted only while the parent
 * menu is open, so `submenuOpen` resets naturally on each re-open instead of
 * needing an effect to sync with `isOpen`.
 *
 * @param {object} props
 * @param {(key: keyof Strings) => string} props.t
 * @param {import('../useDropdown.js').DropdownPosition} props.dropdownPos
 * @param {import('preact').RefObject<HTMLUListElement>} props.dropdownRef
 * @param {(opts: { restoreFocus: boolean }) => void} props.onClose
 * @param {() => void} props.onTriggerFileInput
 * @param {(tab: TabMetadata) => void} props.onAttachTab
 */
function OpenAttachMenu({ t, dropdownPos, dropdownRef, onClose, onTriggerFileInput, onAttachTab }) {
    const submenuRef = useRef(/** @type {HTMLUListElement|null} */ (null));
    const [submenuOpen, setSubmenuOpen] = useState(false);

    // Submenu sits flush with the parent menu's right edge in the same
    // (containing-block-relative) coordinate space dropdownPos uses, so the
    // two panels stay top-aligned regardless of any transformed ancestor.
    // `align: 'left'` on the parent useDropdown guarantees dropdownPos.left is defined.
    const submenuPos =
        submenuOpen && dropdownPos.left !== undefined && dropdownRef.current
            ? { left: dropdownPos.left + dropdownRef.current.offsetWidth + 4, top: dropdownPos.top }
            : null;

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
                <DropdownItem
                    role="menuitem"
                    icon={<ImageIcon />}
                    name={t('omnibar_attachImageOrFileLabel')}
                    onSelect={onTriggerFileInput}
                    onHover={() => setSubmenuOpen(false)}
                />
                <DropdownItem
                    role="menuitem"
                    ariaHasPopup
                    ariaExpanded={submenuOpen}
                    icon={<TabDesktopIcon />}
                    name={t('omnibar_attachPageContentLabel')}
                    trailingIcon={
                        <span class={styles.submenuChevron}>
                            <ChevronSmall />
                        </span>
                    }
                    onSelect={() => setSubmenuOpen(true)}
                    onHover={() => setSubmenuOpen(true)}
                />
            </Dropdown>
            {submenuPos && <TabPicker t={t} position={submenuPos} dropdownRef={submenuRef} onSelect={onAttachTab} onClose={onClose} />}
        </Fragment>
    );
}

/**
 * Recent-tabs picker — a Dropdown with a "Recent Tabs" header and a
 * DropdownItem per open tab.
 *
 * @param {object} props
 * @param {(key: keyof Strings) => string} props.t
 * @param {import('../useDropdown.js').DropdownPosition} props.position
 * @param {import('preact').RefObject<HTMLUListElement>} props.dropdownRef
 * @param {(tab: TabMetadata) => void} props.onSelect
 * @param {(opts: { restoreFocus: boolean }) => void} props.onClose
 */
function TabPicker({ t, position, dropdownRef, onSelect, onClose }) {
    const { tabs } = useOpenTabs({ active: true });

    return (
        <Dropdown
            dropdownRef={dropdownRef}
            role="menu"
            ariaLabel={t('omnibar_attachTabsPickerTitle')}
            header={t('omnibar_attachTabsPickerTitle')}
            position={position}
            onClose={onClose}
            idPrefix="tab-picker-item"
            className={styles.tabPicker}
        >
            {tabs.map((tab) => (
                <DropdownItem
                    key={tab.tabId}
                    role="menuitem"
                    icon={<TabFavicon favicon={tab.favicon} />}
                    name={tab.title}
                    onSelect={() => onSelect(tab)}
                />
            ))}
        </Dropdown>
    );
}

/**
 * @param {object} props
 * @param {Favicon} props.favicon
 */
function TabFavicon({ favicon }) {
    const [errored, setErrored] = useState(false);
    if (!favicon || !favicon.src || errored) {
        return (
            <span class={styles.faviconFallback} aria-hidden="true">
                <GlobeIcon width="12" height="12" />
            </span>
        );
    }
    return <img class={styles.favicon} src={favicon.src} alt="" onError={() => setErrored(true)} loading="lazy" />;
}
