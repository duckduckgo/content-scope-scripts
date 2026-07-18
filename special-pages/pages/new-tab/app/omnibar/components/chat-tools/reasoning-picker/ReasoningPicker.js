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
 * @property {boolean} isAvailable - Whether the option is selectable or gated behind an upsell
 * @property {'subscribe' | 'upgrade'} [upsell] - For a gated option, which upsell flow to trigger
 */

/**
 * @param {object} props
 * @param {ReasoningEffortOptionView[]} props.options
 * @param {ReasoningEffort|null} props.selectedEffort
 * @param {(effort: ReasoningEffort) => void} props.onSelect
 * @param {(type?: 'subscribe' | 'upgrade') => void} props.onUpsell
 * @param {string} props.ariaLabel
 * @param {string} props.buttonLabel
 * @param {string} props.tryForFreeLabel
 * @param {string} props.upgradeLabel
 */
export function ReasoningPicker({ options, selectedEffort, onSelect, onUpsell, ariaLabel, buttonLabel, tryForFreeLabel, upgradeLabel }) {
    const { isOpen, dropdownPos, buttonRef, dropdownRef, toggle, close } = useDropdown({ align: 'right' });

    /** @param {{ restoreFocus: boolean }} opts */
    const handleClose = ({ restoreFocus }) => {
        close();
        if (restoreFocus) buttonRef.current?.focus();
    };

    /** @param {ReasoningEffort} effort */
    const handleSelect = (effort) => {
        const isSupported = options.some((option) => option.id === effort && option.isAvailable);
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
                        const badgeLabel = option.upsell === 'upgrade' ? upgradeLabel : tryForFreeLabel;
                        return (
                            <DropdownItem
                                key={option.id}
                                role="option"
                                icon={<OptionIcon />}
                                name={option.name}
                                description={option.description}
                                isSelected={option.isAvailable && option.id === selectedEffort}
                                ariaSelected={option.isAvailable && option.id === selectedEffort}
                                isDimmed={!option.isAvailable && option.upsell === 'upgrade'}
                                trailingIcon={!option.isAvailable ? <span class={styles.tryForFreeBadge}>{badgeLabel}</span> : undefined}
                                onSelect={() => (option.isAvailable ? handleSelect(option.id) : onUpsell(option.upsell))}
                            />
                        );
                    })}
                </Dropdown>
            )}
        </div>
    );
}
