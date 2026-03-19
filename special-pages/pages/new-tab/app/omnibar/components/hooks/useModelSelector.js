import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

/**
 * @typedef {import('../../../../types/new-tab.js').AIModelSections} AIModelSections
 * @typedef {AIModelSections[number]['items'][number]} AIModelItem
 */

/**
 * @param {AIModelSections} aiModelSections
 */
export function useModelSelector(aiModelSections) {
    const [selectedModelId, setSelectedModelId] = useState(/** @type {string|null} */ (null));
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState(/** @type {{right: number, top: number}|null} */ (null));
    const modelButtonRef = useRef(/** @type {HTMLButtonElement|null} */ (null));
    const dropdownRef = useRef(/** @type {HTMLUListElement|null} */ (null));

    const allModels = useMemo(() => aiModelSections.flatMap((s) => s.items), [aiModelSections]);
    const firstEnabled = useMemo(() => allModels.find((m) => m.isEnabled) ?? null, [allModels]);
    const selectedModel = useMemo(
        () => allModels.find((m) => m.id === selectedModelId && m.isEnabled) ?? firstEnabled,
        [allModels, selectedModelId, firstEnabled],
    );

    useEffect(() => {
        if (!firstEnabled) return;
        if (!selectedModelId || !allModels.some((m) => m.id === selectedModelId && m.isEnabled)) {
            setSelectedModelId(firstEnabled.id);
        }
    }, [aiModelSections, selectedModelId, firstEnabled]);

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
        if (!allModels.some((m) => m.id === id && m.isEnabled)) return;
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
