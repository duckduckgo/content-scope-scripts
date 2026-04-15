import { h } from 'preact';
import cn from 'classnames';
import { ChevronSmall } from '../../../../components/Icons';
import { ModelDropdown } from './ModelDropdown';
import styles from './ModelSelector.module.css';

/**
 * @param {object} props
 * @param {import('./useModelSelector').ModelSelectorState} props.selector
 * @param {import('../../../../../types/new-tab.js').AIModelItem|null} props.selectedModel
 * @param {import('../../../../../types/new-tab.js').AIModelSections} props.aiModelSections
 * @param {string} props.ariaLabel
 */
export function ModelSelector({ selector, selectedModel, aiModelSections, ariaLabel }) {
    const { modelButtonRef, modelDropdownOpen, dropdownPos, dropdownRef, toggleDropdown, closeDropdown, selectModel } = selector;
    /** @param {{ restoreFocus: boolean }} options */
    const handleClose = ({ restoreFocus }) => {
        closeDropdown();
        if (restoreFocus) modelButtonRef.current?.focus();
    };

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
                    ariaLabel={ariaLabel}
                />
            )}
        </div>
    );
}
