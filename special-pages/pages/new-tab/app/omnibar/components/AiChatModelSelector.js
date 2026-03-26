import { h } from 'preact';
import cn from 'classnames';
import { ChevronSmall } from '../../components/Icons';
import { AiChatModelDropdown } from './AiChatModelDropdown';
import styles from './AiChatModelSelector.module.css';

/**
 * @param {object} props
 * @param {import('./hooks/useModelSelector').ModelSelectorState} props.selector
 * @param {import('../../../types/new-tab.js').AIModelSections} props.aiModelSections
 * @param {string} props.ariaLabel
 */
export function AiChatModelSelector({ selector, aiModelSections, ariaLabel }) {
    const { selectedModel, modelButtonRef, modelDropdownOpen, dropdownPos, dropdownRef, toggleDropdown, selectModel } = selector;

    return (
        <div class={styles.modelSelector}>
            <button
                ref={modelButtonRef}
                type="button"
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
                <AiChatModelDropdown
                    dropdownRef={dropdownRef}
                    sections={aiModelSections}
                    selectedModelId={selectedModel?.id}
                    dropdownPos={dropdownPos}
                    onSelect={selectModel}
                    ariaLabel={ariaLabel}
                />
            )}
        </div>
    );
}
