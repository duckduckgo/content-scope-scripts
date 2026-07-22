import { h } from 'preact';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import cn from 'classnames';
import { ChevronSmall } from '../../../../components/Icons';
import { useMessaging } from '../../../../types.js';
import { ModelDropdown } from './ModelDropdown';
import { isUpsellMuted, recordUpsellImpression } from '../upsellImpressions.js';
import { getUpsellCtaLabel } from '../../../utils.js';
import styles from './ModelSelector.module.css';

/**
 * @param {object} props
 * @param {import('./useModelSelector').ModelSelectorState} props.selector
 * @param {import('../../../../../types/new-tab.js').AIModelItem|null} props.selectedModel
 * @param {import('../../../../../types/new-tab.js').AIModelSections} props.aiModelSections
 * @param {(type?: 'subscribe' | 'upgrade') => void} props.onUpsell
 * @param {string} props.ariaLabel
 * @param {boolean} props.isEligibleForFreeTrial - When false, a 'subscribe' upsell shows "Upgrade" instead of "Try for free".
 */
export function ModelSelector({ selector, selectedModel, aiModelSections, onUpsell, ariaLabel, isEligibleForFreeTrial }) {
    const { modelButtonRef, modelDropdownOpen, dropdownPos, dropdownRef, toggleDropdown, closeDropdown, selectModel } = selector;
    const ntp = useMessaging();
    const shownRef = useRef(false);

    // The upsell CTA label(s) the dropdown would show: one entry per all-gated section.
    // Eligibility-aware, so a 'subscribe' upsell reads as "Upgrade" for free-trial-ineligible users.
    const upsellCtas = useMemo(
        () =>
            new Set(
                aiModelSections
                    .filter((section) => section.items.length > 0 && section.items.every((model) => !model.isAvailable))
                    .map((section) => getUpsellCtaLabel(section.items.find((model) => model.upsell)?.upsell, isEligibleForFreeTrial)),
            ),
        [aiModelSections, isEligibleForFreeTrial],
    );

    // Mute the yellow CTA once it has been seen enough times (combined count across both
    // pickers). Freeze the decision for the duration of each open: capture it on the render
    // that opens the dropdown, before this open's impression is recorded below.
    const wasOpenRef = useRef(false);
    const upsellMutedRef = useRef(false);
    if (modelDropdownOpen && !wasOpenRef.current) {
        upsellMutedRef.current = upsellCtas.size > 0 && isUpsellMuted();
    }
    wasOpenRef.current = modelDropdownOpen;

    /** @param {{ restoreFocus: boolean }} options */
    const handleClose = ({ restoreFocus }) => {
        closeDropdown();
        if (restoreFocus) modelButtonRef.current?.focus();
    };

    // Impression telemetry: fire once each time the dropdown opens, plus the CTA(s) it shows.
    useEffect(() => {
        if (!modelDropdownOpen) {
            shownRef.current = false;
            return;
        }
        if (shownRef.current) return;
        shownRef.current = true;

        ntp.telemetryEvent({ attributes: { name: 'omnibar_model_picker_shown' } });

        if (upsellCtas.size > 0) {
            recordUpsellImpression();
        }
        if (upsellCtas.has('tryForFree')) {
            ntp.telemetryEvent({ attributes: { name: 'omnibar_model_picker_tryforfree_shown' } });
        }
        if (upsellCtas.has('upgrade')) {
            ntp.telemetryEvent({ attributes: { name: 'omnibar_model_picker_upgrade_shown' } });
        }
    }, [modelDropdownOpen, upsellCtas, ntp]);

    return (
        <div class={styles.modelSelector}>
            <button
                ref={modelButtonRef}
                type="button"
                tabIndex={0}
                class={cn(styles.modelButton, modelDropdownOpen && styles.modelButtonOpen)}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={modelDropdownOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                }}
            >
                <span class={styles.modelButtonLabel}>{selectedModel?.shortName ?? ariaLabel}</span>
                <ChevronSmall />
            </button>
            {modelDropdownOpen && dropdownPos && (
                <ModelDropdown
                    dropdownRef={dropdownRef}
                    sections={aiModelSections}
                    selectedModelId={selectedModel?.id}
                    dropdownPos={dropdownPos}
                    onClose={handleClose}
                    onSelect={selectModel}
                    onUpsell={onUpsell}
                    className={upsellMutedRef.current ? styles.upsellMuted : undefined}
                    ariaLabel={ariaLabel}
                    isEligibleForFreeTrial={isEligibleForFreeTrial}
                />
            )}
        </div>
    );
}
