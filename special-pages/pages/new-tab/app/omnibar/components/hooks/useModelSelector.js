import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * @typedef {import('../../../../types/new-tab.js').AIModels} AIModels
 * @typedef {AIModels[number]} AIModel
 */

/** @param {AIModel} m */
const isAccessible = (m) => m.entityHasAccess !== false;

/**
 * @param {AIModels} aiModels
 */
export function useModelSelector(aiModels) {
    const [selectedModelId, setSelectedModelId] = useState(/** @type {string|null} */ (null));
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState(/** @type {{right: number, top: number}|null} */ (null));
    const modelButtonRef = useRef(/** @type {HTMLButtonElement|null} */ (null));
    const dropdownRef = useRef(/** @type {HTMLUListElement|null} */ (null));

    const firstAccessible = aiModels.find(isAccessible) ?? null;
    const selectedModel = aiModels.find((m) => m.id === selectedModelId && isAccessible(m)) ?? firstAccessible;

    useEffect(() => {
        if (!firstAccessible) return;
        if (!selectedModelId || !aiModels.some((m) => m.id === selectedModelId && isAccessible(m))) {
            setSelectedModelId(firstAccessible.id);
        }
    }, [aiModels, selectedModelId, firstAccessible]);

    useEffect(() => {
        if (!modelDropdownOpen) return;
        /** @param {MouseEvent} e */
        const handleClickOutside = (e) => {
            const target = /** @type {Node} */ (e.target);
            if (modelButtonRef.current?.parentElement?.contains(target)) return;
            if (dropdownRef.current?.contains(target)) return;
            setModelDropdownOpen(false);
        };
        const handleScroll = () => setModelDropdownOpen(false);
        const handleResize = () => setModelDropdownOpen(false);
        document.addEventListener('click', handleClickOutside, true);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [modelDropdownOpen]);

    const toggleDropdown = () => {
        if (!modelDropdownOpen && modelButtonRef.current) {
            const rect = modelButtonRef.current.getBoundingClientRect();
            setDropdownPos({ right: window.innerWidth - rect.right, top: rect.bottom + 4 });
        }
        setModelDropdownOpen((prev) => !prev);
    };

    /** @param {string} id */
    const selectModel = (id) => {
        if (!aiModels.some((m) => m.id === id && isAccessible(m))) return;
        setSelectedModelId(id);
        setModelDropdownOpen(false);
    };

    return {
        selectedModelId,
        selectedModel,
        modelDropdownOpen,
        dropdownPos,
        modelButtonRef,
        dropdownRef,
        toggleDropdown,
        selectModel,
    };
}
