import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import cn from 'classnames';
import { useDropdown } from '../useDropdown';
import { useMessaging } from '../../../../types.js';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
import { DropdownSeparator } from '../dropdown/DropdownSeparator';
import { DropdownSectionHeader } from '../dropdown/DropdownSectionHeader';
import { getUpsellTelemetryType } from '../../../utils.js';
import dropdownStyles from '../dropdown/Dropdown.module.css';
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
 * @property {string} [gatedSectionHeader] - Section header shown above the first gated option
 */

/**
 * @param {object} props
 * @param {ReasoningEffortOptionView[]} props.options
 * @param {ReasoningEffort|null} props.selectedEffort
 * @param {(effort: ReasoningEffort) => void} props.onSelect
 * @param {(type?: 'subscribe' | 'upgrade') => void} props.onUpsell
 * @param {string} props.ariaLabel
 * @param {string} props.buttonLabel
 * @param {boolean} [props.disabled] - When true, the trigger is inert (hard usage limit).
 * @param {boolean} props.isEligibleForFreeTrial - When false, a 'subscribe' upsell reports 'upgrade' telemetry instead of 'tryForFree'. Does not affect rendered copy, which comes entirely from the payload.
 */
export function ReasoningPicker({
    options,
    selectedEffort,
    onSelect,
    onUpsell,
    ariaLabel,
    buttonLabel,
    disabled = false,
    isEligibleForFreeTrial,
}) {
    const { isOpen, dropdownPos, buttonRef, dropdownRef, toggle, close } = useDropdown({ align: 'right' });
    const ntp = useMessaging();
    const shownRef = useRef(false);

    // Impression telemetry: fire once each time the picker opens. Upsell
    // telemetry is emitted only when the user activates a gated row.
    useEffect(() => {
        if (!isOpen) {
            shownRef.current = false;
            return;
        }
        if (shownRef.current) return;
        shownRef.current = true;

        ntp.telemetryEvent({ attributes: { name: 'omnibar_reasoning_picker_shown' } });
    }, [isOpen, ntp]);

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

    /** @param {'subscribe' | 'upgrade' | undefined} type */
    const handleUpsell = (type) => {
        const telemetryType = getUpsellTelemetryType(type, isEligibleForFreeTrial);
        ntp.telemetryEvent({
            attributes: {
                name: telemetryType === 'upgrade' ? 'omnibar_reasoning_picker_upgrade_shown' : 'omnibar_reasoning_picker_tryforfree_shown',
            },
        });
        onUpsell(type);
    };

    const SelectedOptionIcon = options.find((option) => option.id === selectedEffort)?.icon ?? null;

    let gatedSectionDescriptionId;
    const dropdownItems = options.map((option, optionIndex) => {
        const OptionIcon = option.icon;
        const showHeader = !option.isAvailable && Boolean(option.gatedSectionHeader);
        if (option.isAvailable) {
            gatedSectionDescriptionId = undefined;
        } else if (showHeader) {
            gatedSectionDescriptionId = `reasoning-gated-section-${optionIndex}`;
        }

        const dropdownItem = (
            <DropdownItem
                key={option.id}
                role="option"
                icon={<OptionIcon />}
                name={option.name}
                description={option.description}
                isSelected={option.isAvailable && option.id === selectedEffort}
                ariaSelected={option.isAvailable && option.id === selectedEffort}
                ariaDescribedBy={!option.isAvailable ? gatedSectionDescriptionId : undefined}
                // A gated option with no `upsell` has nowhere to send the user,
                // so the row shows but stays inert.
                disabled={!option.isAvailable && !option.upsell}
                onSelect={() => (option.isAvailable ? handleSelect(option.id) : handleUpsell(option.upsell))}
            />
        );
        if (!showHeader) return dropdownItem;

        return [
            optionIndex > 0 ? <DropdownSeparator key={`${option.id}-separator`} /> : null,
            <DropdownSectionHeader key={`${option.id}-header`} descriptionId={gatedSectionDescriptionId}>
                {option.gatedSectionHeader}
            </DropdownSectionHeader>,
            dropdownItem,
        ];
    });

    return (
        <div class={styles.reasoningPicker}>
            <button
                ref={buttonRef}
                type="button"
                tabIndex={disabled ? -1 : 0}
                class={cn(styles.reasoningButton, isOpen && styles.reasoningButtonOpen)}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                disabled={disabled}
                onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
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
                    className={dropdownStyles.roomy}
                >
                    {dropdownItems}
                </Dropdown>
            )}
        </div>
    );
}
