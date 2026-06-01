import { Fragment, h } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { useTypedTranslationWith } from '../../../../types';
import { ChevronSmall, GlobeIcon, ImageIcon, PageContentIcon, PaperclipIcon } from '../../../../components/Icons';
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
 * @typedef {{ processFiles: (files: File[]) => Promise<void>, disabled: boolean }} ImageChannel
 * @typedef {{ processFiles: (files: File[]) => Promise<void>, disabled: boolean, mimeTypes: string[] }} FileChannel
 */

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * Paperclip entry point. Renders whichever items the caller enabled:
 *   - "Add Images" / "Add PDFs" / "Add Images or PDFs" — file picker entry
 *     whose label and `accept` come from which of `image`/`file` are non-null.
 *   - "Add Page Content" → tab picker, when `tabsEnabled`.
 * Collapses to a direct paperclip-button (no dropdown) when the only enabled
 * mode is image/file. Tabs always render the dropdown so the user has a
 * labelled entry rather than the picker firing on first click.
 *
 * @param {object} props
 * @param {ImageChannel | null} props.image — Pass null to omit the image route.
 * @param {FileChannel | null} props.file — Pass null to omit the file (PDF) route.
 * @param {boolean} props.tabsEnabled
 * @param {(tab: TabMetadata) => void} props.onAttachTab
 */
export function AttachMenu({ image, file, tabsEnabled, onAttachTab }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const attachEnabled = image !== null || file !== null;
    if (!attachEnabled && !tabsEnabled) return null;

    const fileLabel = pickFileLabel(t, image, file);
    const accept = combinedAccept(image, file);
    const fileDisabled = (image?.disabled ?? true) && (file?.disabled ?? true);
    const onAttachChange = makeAttachChangeHandler(image, file);

    if (attachEnabled && !tabsEnabled) {
        return <DirectFileButton ariaLabel={fileLabel} accept={accept} disabled={fileDisabled} onChange={onAttachChange} />;
    }

    return (
        <DropdownMenu
            t={t}
            attachEnabled={attachEnabled}
            fileLabel={fileLabel}
            accept={accept}
            fileDisabled={fileDisabled}
            onAttachChange={onAttachChange}
            onAttachTab={onAttachTab}
        />
    );
}

/**
 * @param {(key: keyof Strings) => string} t
 * @param {ImageChannel | null} image
 * @param {FileChannel | null} file
 */
function pickFileLabel(t, image, file) {
    if (image && file) return t('omnibar_attachImageOrFileLabel');
    if (image) return t('omnibar_attachImageLabel');
    return t('omnibar_attachFileLabel');
}

/**
 * @param {ImageChannel | null} image
 * @param {FileChannel | null} file
 */
function combinedAccept(image, file) {
    return [image ? IMAGE_ACCEPT : '', file ? file.mimeTypes.join(',') : ''].filter(Boolean).join(',');
}

/**
 * Builds the single `onChange` for the hidden file input. Partitions the
 * selected `File`s into images (anything `image/*`) and everything else,
 * routing each subset to the appropriate channel.
 *
 * @param {ImageChannel | null} image
 * @param {FileChannel | null} file
 * @returns {(event: Event) => Promise<void>}
 */
function makeAttachChangeHandler(image, file) {
    return async (event) => {
        const input = /** @type {HTMLInputElement} */ (event.currentTarget);
        if (!input.files || input.files.length === 0) return;
        const all = Array.from(input.files);
        /** @type {Promise<void>[]} */
        const tasks = [];
        if (image) {
            const images = all.filter((f) => f.type.startsWith('image/'));
            if (images.length > 0) tasks.push(image.processFiles(images));
        }
        if (file) {
            const others = all.filter((f) => !f.type.startsWith('image/'));
            if (others.length > 0) tasks.push(file.processFiles(others));
        }
        await Promise.all(tasks);
        input.value = '';
    };
}

/**
 * Single-mode shortcut: a `<label>` that wraps a hidden file input. Used when
 * tabs aren't enabled, so no dropdown is needed.
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
            class={disabled ? `${imageStyles.toolButton} ${imageStyles.toolButtonDisabled}` : imageStyles.toolButton}
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
 * Paperclip-triggered dropdown. Always used when `tabsEnabled` (whether or not
 * the file route is also enabled), so the user always sees a labelled menu
 * entry instead of the picker firing on click. The hidden file input lives
 * here and is `click()`-triggered from the menu entry on a microtask so the
 * menu can finish unmounting before the OS file picker takes focus.
 *
 * @param {object} props
 * @param {(key: keyof Strings) => string} props.t
 * @param {boolean} props.attachEnabled
 * @param {string} props.fileLabel
 * @param {string} props.accept
 * @param {boolean} props.fileDisabled
 * @param {(event: Event) => void} props.onAttachChange
 * @param {(tab: TabMetadata) => void} props.onAttachTab
 */
function DropdownMenu({ t, attachEnabled, fileLabel, accept, fileDisabled, onAttachChange, onAttachTab }) {
    const { isOpen, buttonRef, dropdownRef, dropdownPos, toggle, close } = useDropdown({ align: 'left' });
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));

    const triggerFileInput = () => {
        if (fileDisabled) return;
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
                    accept={accept}
                    multiple
                    aria-hidden="true"
                    tabIndex={-1}
                    disabled={fileDisabled}
                    class={imageStyles.hiddenFileInput}
                    onChange={onAttachChange}
                />
            )}
            {isOpen && dropdownPos && (
                <OpenDropdownBody
                    t={t}
                    attachEnabled={attachEnabled}
                    fileLabel={fileLabel}
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
 * @param {boolean} props.attachEnabled
 * @param {string} props.fileLabel
 * @param {import('../useDropdown.js').DropdownPosition} props.dropdownPos
 * @param {import('preact').RefObject<HTMLUListElement>} props.dropdownRef
 * @param {(opts: { restoreFocus: boolean }) => void} props.onClose
 * @param {() => void} props.onTriggerFileInput
 * @param {(tab: TabMetadata) => void} props.onAttachTab
 */
function OpenDropdownBody({ t, attachEnabled, fileLabel, dropdownPos, dropdownRef, onClose, onTriggerFileInput, onAttachTab }) {
    const submenuRef = useRef(/** @type {HTMLUListElement|null} */ (null));
    const [submenuOpen, setSubmenuOpen] = useState(false);

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
                {attachEnabled && (
                    <DropdownItem
                        role="menuitem"
                        icon={<ImageIcon />}
                        name={fileLabel}
                        onSelect={onTriggerFileInput}
                        onHover={() => setSubmenuOpen(false)}
                    />
                )}
                <DropdownItem
                    role="menuitem"
                    ariaHasPopup
                    ariaExpanded={submenuOpen}
                    icon={<PageContentIcon />}
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
