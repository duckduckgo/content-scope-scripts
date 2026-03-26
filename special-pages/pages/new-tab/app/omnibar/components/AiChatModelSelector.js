import { h } from 'preact';
import cn from 'classnames';
import { ChevronSmall } from '../../components/Icons';
import { AiChatModelDropdown } from './AiChatModelDropdown';
import styles from './AiChatModelSelector.module.css';

/**
 * @param {object} props
 * @param {import('./hooks/useModelSelector').AIModelItem | null} props.selectedModel
 * @param {import('preact').RefObject<HTMLButtonElement>} props.modelButtonRef
 * @param {boolean} props.modelDropdownOpen
 * @param {{right: number, top: number} | null} props.dropdownPos
 * @param {import('preact').RefObject<HTMLUListElement>} props.dropdownRef
 * @param {() => void} props.toggleDropdown
 * @param {(id: string) => void} props.selectModel
 * @param {import('../../../types/new-tab.js').AIModelSections} props.aiModelSections
 * @param {string} props.ariaLabel
 */
export function AiChatModelSelector({
    selectedModel,
    modelButtonRef,
    modelDropdownOpen,
    dropdownPos,
    dropdownRef,
    toggleDropdown,
    selectModel,
    aiModelSections,
    ariaLabel,
}) {
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
