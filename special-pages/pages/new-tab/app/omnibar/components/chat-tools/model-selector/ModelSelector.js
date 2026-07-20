import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import cn from 'classnames';
import { ChevronSmall } from '../../../../components/Icons';
import { useMessaging } from '../../../../types.js';
import { ModelDropdown } from './ModelDropdown';
import styles from './ModelSelector.module.css';

/**
 * @param {object} props
 * @param {import('./useModelSelector').ModelSelectorState} props.selector
 * @param {import('../../../../../types/new-tab.js').AIModelItem|null} props.selectedModel
 * @param {import('../../../../../types/new-tab.js').AIModelSections} props.aiModelSections
 * @param {(type?: 'subscribe' | 'upgrade') => void} props.onUpsell
 * @param {string} props.ariaLabel
 */
export function ModelSelector({ selector, selectedModel, aiModelSections, onUpsell, ariaLabel }) {
    const { modelButtonRef, modelDropdownOpen, dropdownPos, dropdownRef, toggleDropdown, closeDropdown, selectModel } = selector;
    const ntp = useMessaging();
    const shownRef = useRef(false);

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

        const upsellCtas = new Set(
            aiModelSections
                .filter((section) => section.items.length > 0 && section.items.every((model) => !model.isAvailable))
                .map((section) => section.items.find((model) => model.upsell)?.upsell ?? 'subscribe'),
        );
        if (upsellCtas.has('subscribe')) {
            ntp.telemetryEvent({ attributes: { name: 'omnibar_model_picker_tryforfree_shown' } });
        }
        if (upsellCtas.has('upgrade')) {
            ntp.telemetryEvent({ attributes: { name: 'omnibar_model_picker_upgrade_shown' } });
        }
    }, [modelDropdownOpen, aiModelSections, ntp]);

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
                    ariaLabel={ariaLabel}
                />
            )}
        </div>
    );
}
