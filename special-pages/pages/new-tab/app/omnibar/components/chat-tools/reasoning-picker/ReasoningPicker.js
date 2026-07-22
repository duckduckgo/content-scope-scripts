import { h } from 'preact';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import cn from 'classnames';
import { useDropdown } from '../useDropdown';
import { useMessaging } from '../../../../types.js';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
import { isUpsellMuted, recordUpsellImpression } from '../upsellImpressions.js';
import { getUpsellCtaLabel } from '../../../utils.js';
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
 * @param {boolean} props.isEligibleForFreeTrial - When false, a 'subscribe' upsell shows the upgrade label instead of "Try for free".
 */
export function ReasoningPicker({
    options,
    selectedEffort,
    onSelect,
    onUpsell,
    ariaLabel,
    buttonLabel,
    tryForFreeLabel,
    upgradeLabel,
    isEligibleForFreeTrial,
}) {
    const { isOpen, dropdownPos, buttonRef, dropdownRef, toggle, close } = useDropdown({ align: 'right' });
    const ntp = useMessaging();
    const shownRef = useRef(false);

    const gated = useMemo(() => options.filter((option) => !option.isAvailable), [options]);

    // Mute the yellow CTA once it has been seen enough times (combined count across both
    // pickers). Freeze the decision for the duration of each open: capture it on the render
    // that opens the picker, before this open's impression is recorded below.
    const wasOpenRef = useRef(false);
    const upsellMutedRef = useRef(false);
    if (isOpen && !wasOpenRef.current) {
        upsellMutedRef.current = gated.length > 0 && isUpsellMuted();
    }
    wasOpenRef.current = isOpen;

    // Impression telemetry: fire once each time the picker opens, plus the CTA(s) it shows.
    useEffect(() => {
        if (!isOpen) {
            shownRef.current = false;
            return;
        }
        if (shownRef.current) return;
        shownRef.current = true;

        ntp.telemetryEvent({ attributes: { name: 'omnibar_reasoning_picker_shown' } });

        if (gated.length > 0) {
            recordUpsellImpression();
        }
        // Report the CTA label that is actually shown, which is eligibility-aware
        // (a 'subscribe' upsell reads as "Upgrade" for free-trial-ineligible users).
        const gatedLabels = gated.map((option) => getUpsellCtaLabel(option.upsell, isEligibleForFreeTrial));
        if (gatedLabels.includes('tryForFree')) {
            ntp.telemetryEvent({ attributes: { name: 'omnibar_reasoning_picker_tryforfree_shown' } });
        }
        if (gatedLabels.includes('upgrade')) {
            ntp.telemetryEvent({ attributes: { name: 'omnibar_reasoning_picker_upgrade_shown' } });
        }
    }, [isOpen, gated, ntp, isEligibleForFreeTrial]);

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
                    className={cn(dropdownStyles.roomy, upsellMutedRef.current && styles.upsellMuted)}
                >
                    {options.map((option) => {
                        const OptionIcon = option.icon;
                        const badgeLabel =
                            getUpsellCtaLabel(option.upsell, isEligibleForFreeTrial) === 'upgrade' ? upgradeLabel : tryForFreeLabel;
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
