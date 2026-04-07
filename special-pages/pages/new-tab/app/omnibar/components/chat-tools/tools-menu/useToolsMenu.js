import { useDropdown } from '../useDropdown';

/**
 * @typedef {ReturnType<typeof useToolsMenu>} ToolsMenuState
 */

/**
 * Manages the tools menu dropdown open/close state and positioning.
 */
export function useToolsMenu() {
    const dropdown = useDropdown({ align: 'left' });

    return {
        menuOpen: dropdown.isOpen,
        dropdownPos: dropdown.dropdownPos,
        buttonRef: dropdown.buttonRef,
        dropdownRef: dropdown.dropdownRef,
        toggleMenu: dropdown.toggle,
        closeMenu: dropdown.close,
    };
}
