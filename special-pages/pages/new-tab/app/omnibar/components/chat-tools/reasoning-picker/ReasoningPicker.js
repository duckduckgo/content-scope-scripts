import { h } from 'preact';
import cn from 'classnames';
import { useDropdown } from '../useDropdown';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
import { getReasoningEffortIcon } from './getReasoningEffortIcon';
import styles from './ReasoningPicker.module.css';

/**
 * @typedef {import('../../../../../types/new-tab.js').ReasoningEffort} ReasoningEffort
 *
 * @typedef {object} ReasoningEffortOption
 * @property {ReasoningEffort} id - Stable server key
 * @property {string} label - Localized label
 * @property {string} description - Localized description
 */

/**
 * @param {object} props
 * @param {ReasoningEffortOption[]} props.options
 * @param {ReasoningEffort|null} props.selectedEffort
 * @param {(effort: ReasoningEffort) => void} props.onSelect
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

    /** @param {ReasoningEffort} effort */
    const handleSelect = (effort) => {
        const isSupported = options.some((option) => option.id === effort);
        if (!isSupported) return;
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
                <Dropdown
                    dropdownRef={dropdownRef}
                    role="listbox"
                    ariaLabel={ariaLabel}
                    position={dropdownPos}
                    onClose={handleClose}
                    idPrefix="reasoning-option"
                >
                    {options.map((option) => {
                        const OptionIcon = getReasoningEffortIcon(option.id);
                        return (
                            <DropdownItem
                                key={option.id}
                                role="option"
                                icon={OptionIcon ? <OptionIcon /> : null}
                                name={option.label}
                                description={option.description}
                                isSelected={option.id === selectedEffort}
                                ariaSelected={option.id === selectedEffort}
                                onSelect={() => handleSelect(option.id)}
                            />
                        );
                    })}
                </Dropdown>
            )}
        </div>
    );
}
