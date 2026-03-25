import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

/**
 * @typedef {import('../../../../types/new-tab.js').AIModelSections} AIModelSections
 * @typedef {AIModelSections[number]['items'][number]} AIModelItem
 */

/**
 * Walks up the DOM to find the nearest ancestor that creates a containing block
 * for `position: fixed` (e.g. transform, will-change, filter, backdrop-filter).
 * @param {Element} el
 * @returns {Element | null}
 */
function findContainingBlock(el) {
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        const wc = style.willChange;
        if (
            style.transform !== 'none' ||
            style.filter !== 'none' ||
            style.backdropFilter !== 'none' ||
            (wc && (wc.includes('transform') || wc.includes('perspective') || wc.includes('filter')))
        ) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}

/**
 * @param {object} options
 * @param {AIModelSections} options.aiModelSections
 * @param {string} [options.persistedModelId] - Model ID from persisted config (synced across tabs)
 * @param {(id: string) => void} [options.onModelChange] - Called when the user selects a model, to persist the choice
 */
export function useModelSelector({ aiModelSections, persistedModelId, onModelChange }) {
    const [userSelectedId, setUserSelectedId] = useState(/** @type {string|null} */ (null));
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState(/** @type {{right: number, top: number}|null} */ (null));
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
            const cb = findContainingBlock(modelButtonRef.current);
            const cbRect = cb?.getBoundingClientRect();
            const rightEdge = cbRect?.right ?? window.innerWidth;
            const topOffset = cbRect?.top ?? 0;
            setDropdownPos({ right: rightEdge - rect.right, top: rect.bottom - topOffset + 4 });
        }
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
        dropdownPos,
        modelButtonRef,
        dropdownRef,
        toggleDropdown,
        selectModel,
    };
}
