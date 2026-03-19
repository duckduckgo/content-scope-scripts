import { h } from 'preact';
import { ChevronSmall, getModelIcon } from '../../components/Icons';
import { AiChatModelDropdown } from './AiChatModelDropdown';
import styles from './AiChatForm.module.css';

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
    const Icon = selectedModel ? getModelIcon(selectedModel.id) : null;

    return (
        <div class={styles.modelSelector}>
            <button
                ref={modelButtonRef}
                type="button"
                class={`${styles.modelButton} ${modelDropdownOpen ? styles.modelButtonOpen : ''}`}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={modelDropdownOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                }}
            >
                {Icon && <Icon />}
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
