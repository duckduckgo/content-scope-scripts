import { h } from 'preact';
import cn from 'classnames';
import { ReasoningDropdown } from './ReasoningDropdown';
import { getReasoningEffortIcon } from './getReasoningEffortIcon';
import styles from './ReasoningPicker.module.css';

/**
 * @param {object} props
 * @param {import('./useReasoningPicker').ReasoningPickerState} props.picker
 * @param {import('./ReasoningDropdown').ReasoningEffortOption[]} props.options
 * @param {import('../../../../../types/new-tab.js').ReasoningEffort|null} props.selectedEffort
 * @param {string} props.ariaLabel
 * @param {string} props.buttonLabel
 */
export function ReasoningPicker({ picker, options, selectedEffort, ariaLabel, buttonLabel }) {
    const { buttonRef, dropdownOpen, dropdownPos, dropdownRef, toggleDropdown, closeDropdown, selectEffort } = picker;
    /** @param {{ restoreFocus: boolean }} opts */
    const handleClose = ({ restoreFocus }) => {
        closeDropdown();
        if (restoreFocus) buttonRef.current?.focus();
    };

    const Icon = selectedEffort ? getReasoningEffortIcon(selectedEffort) : null;

    return (
        <div class={styles.reasoningPicker}>
            <button
                ref={buttonRef}
                type="button"
                tabIndex={0}
                class={cn(styles.reasoningButton, dropdownOpen && styles.reasoningButtonOpen)}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                }}
            >
                {Icon && <Icon class={styles.buttonIcon} />}
                <span class={styles.buttonLabel}>{buttonLabel}</span>
            </button>
            {dropdownOpen && dropdownPos && (
                <ReasoningDropdown
                    dropdownRef={dropdownRef}
                    options={options}
                    selectedEffort={selectedEffort}
                    dropdownPos={dropdownPos}
                    onClose={handleClose}
                    onSelect={selectEffort}
                    ariaLabel={ariaLabel}
                />
            )}
        </div>
    );
}
