import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

/**
 * @typedef {import('../../../../types/new-tab.js').AIModelSections} AIModelSections
 * @typedef {AIModelSections[number]['items'][number]} AIModelItem
 */

/**
 * @param {object} options
 * @param {AIModelSections} options.aiModelSections
 * @param {string} [options.persistedModelId] - Model ID from persisted config (synced across tabs)
 * @param {(id: string) => void} [options.onModelChange] - Called when the user selects a model, to persist the choice
 */
export function useModelSelector({ aiModelSections, persistedModelId, onModelChange }) {
    const [selectedModelId, setSelectedModelId] = useState(/** @type {string|null} */ (persistedModelId ?? null));
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

    // Unified reconciliation: persisted preference takes priority, then current
    // selection (if still valid), then first enabled model as fallback.
    // Merged into a single effect to prevent the two concerns from racing on
    // the same render cycle (e.g. initial config load).
    useEffect(() => {
        if (persistedModelId && allModels.some((m) => m.id === persistedModelId && m.isEnabled)) {
            if (selectedModelId !== persistedModelId) {
                setSelectedModelId(persistedModelId);
            }
            return;
        }
        if (selectedModelId && allModels.some((m) => m.id === selectedModelId && m.isEnabled)) {
            return;
        }
        if (firstEnabled) {
            setSelectedModelId(firstEnabled.id);
            onModelChange?.(firstEnabled.id);
        }
    }, [persistedModelId, aiModelSections, selectedModelId, firstEnabled]);

    useEffect(() => {
        if (!modelDropdownOpen) return;
        /** @param {MouseEvent} e */
        const handleClickOutside = (e) => {
            const target = /** @type {Node} */ (e.target);
            if (modelButtonRef.current?.parentElement?.contains(target)) return;
            if (dropdownRef.current?.contains(target)) return;
            setModelDropdownOpen(false);
        };
        const handleResize = () => setModelDropdownOpen(false);
        document.addEventListener('click', handleClickOutside, true);
        window.addEventListener('resize', handleResize);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
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
        onModelChange?.(id);
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
