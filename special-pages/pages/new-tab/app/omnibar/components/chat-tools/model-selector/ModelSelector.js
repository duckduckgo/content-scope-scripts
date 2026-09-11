import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import cn from 'classnames';
import { ChevronSmall } from '../../../../components/Icons';
import { useMessaging } from '../../../../types.js';
import { ModelDropdown } from './ModelDropdown';
import { getUpsellTelemetryType } from '../../../utils.js';
import styles from './ModelSelector.module.css';

/**
 * @param {object} props
 * @param {import('./useModelSelector').ModelSelectorState} props.selector
 * @param {import('../../../../../types/new-tab.js').AIModelItem|null} props.selectedModel
 * @param {import('../../../../../types/new-tab.js').AIModelSections} props.aiModelSections
 * @param {(type?: 'subscribe' | 'upgrade') => void} props.onUpsell
 * @param {string} props.ariaLabel
 * @param {boolean} props.isEligibleForFreeTrial - When false, a 'subscribe' upsell reports 'upgrade' telemetry instead of 'tryForFree'. Does not affect rendered copy, which comes entirely from the payload.
 */
export function ModelSelector({ selector, selectedModel, aiModelSections, onUpsell, ariaLabel, isEligibleForFreeTrial }) {
    const { modelButtonRef, modelDropdownOpen, dropdownPos, dropdownRef, toggleDropdown, closeDropdown, selectModel } = selector;
    const ntp = useMessaging();
    const shownRef = useRef(false);

    /** @param {{ restoreFocus: boolean }} options */
    const handleClose = ({ restoreFocus }) => {
        closeDropdown();
        if (restoreFocus) modelButtonRef.current?.focus();
    };

    /** @param {'subscribe' | 'upgrade' | undefined} type */
    const handleUpsell = (type) => {
        const telemetryType = getUpsellTelemetryType(type, isEligibleForFreeTrial);
        ntp.telemetryEvent({
            attributes: {
                name: telemetryType === 'upgrade' ? 'omnibar_model_picker_upgrade_shown' : 'omnibar_model_picker_tryforfree_shown',
            },
        });
        onUpsell(type);
    };

    // Impression telemetry: fire once each time the dropdown opens. Upsell
    // telemetry is emitted only when the user activates a gated row.
    useEffect(() => {
        if (!modelDropdownOpen) {
            shownRef.current = false;
            return;
        }
        if (shownRef.current) return;
        shownRef.current = true;

        ntp.telemetryEvent({ attributes: { name: 'omnibar_model_picker_shown' } });
    }, [modelDropdownOpen, ntp]);

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
                    onUpsell={handleUpsell}
                    ariaLabel={ariaLabel}
                />
            )}
        </div>
    );
}
