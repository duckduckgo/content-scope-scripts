import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';

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
    const [userSelectedId, setUserSelectedId] = useState(/** @type {string|null} */ (null));
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const modelButtonRef = useRef(/** @type {HTMLButtonElement|null} */ (null));
    const dropdownRef = useRef(/** @type {HTMLUListElement|null} */ (null));

    const allModels = useMemo(() => aiModelSections.flatMap((s) => s.items), [aiModelSections]);
    const firstEnabled = useMemo(() => allModels.find((m) => m.isEnabled) ?? null, [allModels]);

    // Resolve the effective model ID: persisted > user choice > first enabled.
    const selectedModelId = useMemo(() => {
        if (persistedModelId && allModels.some((m) => m.id === persistedModelId && m.isEnabled)) {
            return persistedModelId;
        }
        if (userSelectedId && allModels.some((m) => m.id === userSelectedId && m.isEnabled)) {
            return userSelectedId;
        }
        return firstEnabled?.id ?? null;
    }, [persistedModelId, userSelectedId, allModels, firstEnabled]);

    const selectedModel = useMemo(
        () => allModels.find((m) => m.id === selectedModelId && m.isEnabled) ?? firstEnabled,
        [allModels, selectedModelId, firstEnabled],
    );

    useLayoutEffect(() => {
        if (!modelDropdownOpen || !modelButtonRef.current || !dropdownRef.current) return;

        const reference = modelButtonRef.current;
        const floating = dropdownRef.current;

        return autoUpdate(reference, floating, async () => {
            const { x, y } = await computePosition(reference, floating, {
                placement: 'bottom-end',
                middleware: [offset(4), flip(), shift({ padding: 8 })],
            });
            Object.assign(floating.style, {
                left: `${x}px`,
                top: `${y}px`,
            });
        });
    }, [modelDropdownOpen]);

    useEffect(() => {
        if (!modelDropdownOpen) return;
        /** @param {MouseEvent} e */
        const handleClickOutside = (e) => {
            const target = /** @type {Node} */ (e.target);
            if (modelButtonRef.current?.parentElement?.contains(target)) return;
            if (dropdownRef.current?.contains(target)) return;
            setModelDropdownOpen(false);
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [modelDropdownOpen]);

    const toggleDropdown = () => {
        setModelDropdownOpen((prev) => !prev);
    };

    /** @param {string} id */
    const selectModel = (id) => {
        if (!allModels.some((m) => m.id === id && m.isEnabled)) return;
        setUserSelectedId(id);
        setModelDropdownOpen(false);
        onModelChange?.(id);
    };

    return {
        selectedModelId,
        selectedModel,
        modelDropdownOpen,
        modelButtonRef,
        dropdownRef,
        toggleDropdown,
        selectModel,
    };
}
