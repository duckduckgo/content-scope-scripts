import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useEnv } from '../../../../../../shared/components/EnvironmentProvider.js';

/**
 * @typedef {import('./suggestedPrompts.data.js').TabId} TabId
 * @typedef {'left' | 'right'} SwapDirection
 */

/**
 * Which suggested prompts tab is open, the close and tab-switch animations, arrow-key navigation, and closing on an
 * outside click or Escape.
 *
 * @param {object} params
 * @param {TabId[]} params.tabIds - Tabs currently shown, in order. A tab that drops out while open counts as closed.
 * @param {import('preact').RefObject<HTMLElement>} params.containerRef
 */
export function useSuggestedPromptTabs({ tabIds, containerRef }) {
    const { isReducedMotion } = useEnv();
    const [openTabId, setOpenTabId] = useState(/** @type {TabId | null} */ (null));
    /** Tab whose panel is still playing its close animation. */
    const [exitingTabId, setExitingTabId] = useState(/** @type {TabId | null} */ (null));
    /** Previous tab's content sliding out while the newly selected one slides in. */
    const [swap, setSwap] = useState(/** @type {{ tabId: TabId, direction: SwapDirection } | null} */ (null));
    /** @type {import('preact/hooks').MutableRef<Partial<Record<TabId, HTMLButtonElement|null>>>} */
    const tabRefs = useRef({});

    const activeTabId = openTabId && tabIds.includes(openTabId) ? openTabId : null;
    const renderedTabId = activeTabId ?? (exitingTabId && tabIds.includes(exitingTabId) ? exitingTabId : null);
    const panelExiting = !activeTabId && renderedTabId !== null;

    /** @param {TabId} id */
    const openTab = (id) => {
        setExitingTabId(null);
        if (activeTabId && activeTabId !== id && !isReducedMotion) {
            const direction = tabIds.indexOf(id) >= tabIds.indexOf(activeTabId) ? 'right' : 'left';
            setSwap({ tabId: activeTabId, direction });
        }
        setOpenTabId(id);
    };

    const close = useCallback(
        /** @param {{ restoreFocus?: boolean }} [options] */
        (options) => {
            setExitingTabId(isReducedMotion ? null : activeTabId);
            setSwap(null);
            setOpenTabId(null);
            if (options?.restoreFocus && activeTabId) tabRefs.current[activeTabId]?.focus();
        },
        [activeTabId, isReducedMotion],
    );

    useEffect(() => {
        if (!activeTabId) return;
        /** @param {PointerEvent} event */
        const handlePointerDown = (event) => {
            if (event.target instanceof Node && containerRef.current?.contains(event.target)) return;
            close();
        };
        /** @param {KeyboardEvent} event */
        const handleKeyDown = (event) => {
            if (event.defaultPrevented || event.key !== 'Escape') return;
            event.preventDefault();
            // Escape pressed in the composer closes the panel but leaves the caret where it is.
            close({ restoreFocus: containerRef.current?.contains(document.activeElement) === true });
        };
        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeTabId, close, containerRef]);

    /**
     * @param {KeyboardEvent} event
     * @param {number} index
     */
    const handleTabKeyDown = (event, index) => {
        /** @type {number} */
        let next;
        switch (event.key) {
            case 'ArrowRight':
                next = (index + 1) % tabIds.length;
                break;
            case 'ArrowLeft':
                next = (index - 1 + tabIds.length) % tabIds.length;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = tabIds.length - 1;
                break;
            default:
                return;
        }
        event.preventDefault();
        const nextId = tabIds[next];
        openTab(nextId);
        tabRefs.current[nextId]?.focus();
    };

    /** @param {TabId} id */
    const tabRef = (id) => (/** @type {HTMLButtonElement|null} */ el) => {
        tabRefs.current[id] = el;
    };

    /** @param {AnimationEvent} event */
    const endPanelExit = (event) => {
        if (event.target === event.currentTarget && panelExiting) setExitingTabId(null);
    };

    /** @param {AnimationEvent} event */
    const endSwap = (event) => {
        if (event.target === event.currentTarget) setSwap(null);
    };

    return { activeTabId, renderedTabId, panelExiting, swap, openTab, close, handleTabKeyDown, tabRef, endPanelExit, endSwap };
}
