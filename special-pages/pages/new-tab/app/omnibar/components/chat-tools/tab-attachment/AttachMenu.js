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

    const fileInput = resolveFileInput(t, image, file);

    if (attachEnabled && !tabsEnabled) {
        return (
            <DirectFileButton
                ariaLabel={fileInput.label}
                accept={fileInput.accept}
                disabled={fileInput.disabled}
                onChange={fileInput.onChange}
            />
        );
    }

    return <DropdownMenu t={t} attachEnabled={attachEnabled} fileInput={fileInput} onAttachTab={onAttachTab} />;
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
 * Paperclip-triggered dropdown. Always used when `tabsEnabled` (whether or not
 * the file route is also enabled), so the user always sees a labelled menu
 * entry instead of the picker firing on click. The hidden file input lives
 * here and is `click()`-triggered from the menu entry on a microtask so the
 * menu can finish unmounting before the OS file picker takes focus.
 *
 * @param {object} props
 * @param {(key: keyof Strings) => string} props.t
 * @param {boolean} props.attachEnabled
 * @param {ResolvedFileInput} props.fileInput
 * @param {(tab: TabMetadata) => void} props.onAttachTab
 */
function DropdownMenu({ t, attachEnabled, fileInput, onAttachTab }) {
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
                    t={t}
                    attachEnabled={attachEnabled}
                    fileLabel={fileInput.label}
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
        </div>
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
                        icon={<FolderIcon />}
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
