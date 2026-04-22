import { h } from 'preact';
import cn from 'classnames';
import { useDropdown } from '../useDropdown';
import { ReasoningDropdown } from './ReasoningDropdown';
import { getReasoningEffortIcon } from './getReasoningEffortIcon';
import styles from './ReasoningPicker.module.css';

/**
 * @param {object} props
 * @param {import('./ReasoningDropdown').ReasoningEffortOption[]} props.options
 * @param {import('../../../../../types/new-tab.js').ReasoningEffort|null} props.selectedEffort
 * @param {(effort: import('../../../../../types/new-tab.js').ReasoningEffort) => void} props.onSelect
 * @param {string} props.ariaLabel
 * @param {string} props.buttonLabel
 */
export function ReasoningPicker({ options, selectedEffort, onSelect, ariaLabel, buttonLabel }) {
    const { isOpen, dropdownPos, buttonRef, dropdownRef, toggle, close } = useDropdown({ align: 'right' });

    /** @param {{ restoreFocus: boolean }} opts */
    const handleClose = ({ restoreFocus }) => {
        close();
        if (restoreFocus) buttonRef.current?.focus();
    };

    /** @param {import('../../../../../types/new-tab.js').ReasoningEffort} effort */
    const handleSelect = (effort) => {
        if (!options.some((option) => option.id === effort)) return;
        close();
        onSelect(effort);
    };

    const Icon = selectedEffort ? getReasoningEffortIcon(selectedEffort) : null;

    return (
        <div class={styles.reasoningPicker}>
            <button
                ref={buttonRef}
                type="button"
                tabIndex={0}
                class={cn(styles.reasoningButton, isOpen && styles.reasoningButtonOpen)}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                }}
            >
                {Icon && <Icon class={styles.buttonIcon} />}
                <span class={styles.buttonLabel}>{buttonLabel}</span>
            </button>
            {isOpen && dropdownPos && (
                <ReasoningDropdown
                    dropdownRef={dropdownRef}
                    options={options}
                    selectedEffort={selectedEffort}
                    dropdownPos={dropdownPos}
                    onClose={handleClose}
                    onSelect={handleSelect}
                    ariaLabel={ariaLabel}
                />
            )}
        </div>
    );
}
