import { useDropdown } from '../useDropdown';

/**
 * @typedef {import('../../../../../types/new-tab.js').AIModelSections} AIModelSections
 * @typedef {import('../../../../../types/new-tab.js').AIModelItem} AIModelItem
 * @typedef {ReturnType<typeof useModelSelector>} ModelSelectorState
 */

/**
 * @param {object} options
 * @param {AIModelItem[]} options.allModels
 * @param {(id: string) => void} [options.onModelChange] - Called when the user selects a model, to persist the choice
 * @param {() => void} [options.onOpen] - Called when the dropdown opens, to report a picker impression
 */
export function useModelSelector({ allModels, onModelChange, onOpen }) {
    const dropdown = useDropdown({ align: 'right', onOpen });

    /** @param {string} id */
    const selectModel = (id) => {
        if (!allModels.some((m) => m.id === id && m.isEnabled)) return;
        dropdown.close();
        onModelChange?.(id);
    };

    return {
        modelDropdownOpen: dropdown.isOpen,
        dropdownPos: dropdown.dropdownPos,
        modelButtonRef: dropdown.buttonRef,
        dropdownRef: dropdown.dropdownRef,
        toggleDropdown: dropdown.toggle,
        closeDropdown: dropdown.close,
        selectModel,
    };
}
