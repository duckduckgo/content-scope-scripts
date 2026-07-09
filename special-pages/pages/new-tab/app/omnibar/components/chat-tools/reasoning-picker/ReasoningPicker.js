import { h } from 'preact';
import cn from 'classnames';
import { useDropdown } from '../useDropdown';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
import styles from './ReasoningPicker.module.css';

/**
 * @typedef {import('../../../../../types/new-tab.js').ReasoningEffort} ReasoningEffort
 *
 * @typedef {import('preact').ComponentType<import('preact').JSX.SVGAttributes<SVGSVGElement>>} ReasoningEffortIconComponent
 *
 * @typedef {object} ReasoningEffortOptionView
 * @property {ReasoningEffort} id - Server key; round-tripped on submit
 * @property {ReasoningEffortIconComponent} icon - Icon component rendered in the button and dropdown
 * @property {string} name - Localized label
 * @property {string} [description] - Localized description
 * @property {'available' | 'unavailable'} status - Whether the option is selectable or gated behind an upsell
 */

/**
 * @param {object} props
 * @param {ReasoningEffortOptionView[]} props.options
 * @param {ReasoningEffort|null} props.selectedEffort
 * @param {(effort: ReasoningEffort) => void} props.onSelect
 * @param {() => void} props.onUpsell
 * @param {string} props.ariaLabel
 * @param {string} props.buttonLabel
 * @param {string} props.tryForFreeLabel
 */
export function ReasoningPicker({ options, selectedEffort, onSelect, onUpsell, ariaLabel, buttonLabel, tryForFreeLabel }) {
    const { isOpen, dropdownPos, buttonRef, dropdownRef, toggle, close } = useDropdown({ align: 'right' });

    /** @param {{ restoreFocus: boolean }} opts */
    const handleClose = ({ restoreFocus }) => {
        close();
        if (restoreFocus) buttonRef.current?.focus();
    };

    /** @param {ReasoningEffort} effort */
    const handleSelect = (effort) => {
        const isSupported = options.some((option) => option.id === effort && option.status === 'available');
        if (!isSupported) return;
        onSelect(effort);
    };

    const SelectedOptionIcon = options.find((option) => option.id === selectedEffort)?.icon ?? null;

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
                {SelectedOptionIcon && <SelectedOptionIcon class={styles.buttonIcon} />}
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
                        const OptionIcon = option.icon;
                        const isUnavailable = option.status === 'unavailable';
                        return (
                            <DropdownItem
                                key={option.id}
                                role="option"
                                icon={<OptionIcon />}
                                name={option.name}
                                description={option.description}
                                isSelected={!isUnavailable && option.id === selectedEffort}
                                ariaSelected={!isUnavailable && option.id === selectedEffort}
                                trailingIcon={isUnavailable ? <span class={styles.tryForFreeBadge}>{tryForFreeLabel}</span> : undefined}
                                onSelect={() => (isUnavailable ? onUpsell() : handleSelect(option.id))}
                            />
                        );
                    })}
                </Dropdown>
            )}
        </div>
    );
}
