import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'preact/hooks';
import { useOpenTabs } from './useOpenTabs';
import { filterTabs } from './tabFilter.js';

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('../../AiChatForm').ComboboxOverride} ComboboxOverride
 */

const LISTBOX_ID = 'omnibar-mention-picker';

/**
 * Owns the full `@`-mention typeahead flow: input detection, the open-tab
 * fetch, client-side filtering, keyboard nav and highlight state, picker
 * positioning, and stripping the `@…` token from the input on select.
 *
 * @param {object} params
 * @param {boolean} params.enabled — Master switch (feature flag + model capability).
 * @param {string} params.query — Current input value, needed to strip a `@…` mention on select.
 * @param {(value: string) => void} params.onChange — Update the input value (used to strip the mention).
 * @param {() => void} params.hideChats — Recent-chats hide callback from the omnibar.
 * @param {(tab: TabMetadata) => void} params.onAttachTab — Called when the user confirms a tab in the picker.
 * @param {import('preact').RefObject<HTMLTextAreaElement>} params.textareaRef — Textarea the mention is being typed into. Used to restore focus/caret after the user picks a tab.
 * @param {import('preact').RefObject<HTMLElement>} params.anchorRef — Positioning context the picker wrapper is absolutely positioned within. Used to compute the picker's vertical offset so it sits just below the textarea (which lives inside an `overflow: hidden` ancestor and so can't be a positioning parent directly).
 */
export function useMentionPicker({ enabled, query, onChange, hideChats, onAttachTab, textareaRef, anchorRef }) {
    const [anchor, setAnchor] = useState(/** @type {number | null} */ (null));
    const [mentionQuery, setMentionQuery] = useState('');
    const pickerActive = enabled && anchor !== null;
    const { tabs } = useOpenTabs({ active: pickerActive });

    const filtered = useMemo(() => filterTabs(tabs, mentionQuery), [tabs, mentionQuery]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [anchorTop, setAnchorTop] = useState(0);

    const [prevFilteredLength, setPrevFilteredLength] = useState(filtered.length);
    if (prevFilteredLength !== filtered.length) {
        setPrevFilteredLength(filtered.length);
        setActiveIndex(filtered.length > 0 ? 0 : -1);
    }

    const closePicker = useCallback(() => {
        setAnchor(null);
        setMentionQuery('');
    }, []);

    const handleTextChange = useCallback(
        /** @param {string} value @param {number} [caret] */
        (value, caret) => {
            if (!enabled) return;
            const cursor = caret ?? value.length;

            if (anchor !== null) {
                // Picker is open — keep query in sync, or close if the mention
                // has been deleted or committed by whitespace.
                if (cursor <= anchor || value[anchor] !== '@') {
                    closePicker();
                    return;
                }
                const next = value.slice(anchor + 1, cursor);
                if (/\s/.test(next)) {
                    closePicker();
                    return;
                }
                setMentionQuery(next);
                return;
            }

            // Picker is closed — detect a freshly typed `@` at a word boundary.
            if (cursor < 1 || value[cursor - 1] !== '@') return;
            const prev = cursor >= 2 ? value[cursor - 2] : '';
            if (prev !== '' && !/\s/.test(prev)) return;
            setAnchor(cursor - 1);
            setMentionQuery('');
            hideChats();
        },
        [enabled, anchor, hideChats, closePicker],
    );

    const handleTabSelect = useCallback(
        /** @param {TabMetadata} tab */
        (tab) => {
            if (anchor !== null) {
                const before = query.slice(0, anchor);
                const after = query.slice(anchor + 1 + mentionQuery.length);
                onChange(before + after);
                const caret = before.length;
                // Defer caret restoration until the controlled value commits,
                // otherwise the caret jumps to end-of-text.
                queueMicrotask(() => {
                    textareaRef.current?.focus();
                    textareaRef.current?.setSelectionRange(caret, caret);
                });
            }
            onAttachTab(tab);
            closePicker();
        },
        [anchor, mentionQuery, query, onChange, onAttachTab, closePicker, textareaRef],
    );

    // Keep recent-chats collapsed whenever the picker is open.
    useEffect(() => {
        if (pickerActive) hideChats();
    }, [pickerActive, hideChats]);

    // While the picker is open, glue its top to the textarea bottom. The picker
    // wrapper is rendered as a sibling of the input field (so the input's
    // `overflow: hidden` doesn't clip it), which means we can't use CSS
    // `top: 100%` of the textarea — measure it instead and recompute whenever
    // the textarea grows (multi-line typing) or the field's layout shifts
    // (focus state changes its margin).
    useLayoutEffect(() => {
        if (!pickerActive) return;
        const textarea = textareaRef.current;
        const anchorEl = anchorRef.current;
        if (!textarea || !anchorEl) return;

        const update = () => {
            const taRect = textarea.getBoundingClientRect();
            const anchorRect = anchorEl.getBoundingClientRect();
            setAnchorTop(taRect.bottom - anchorRect.top);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(textarea);
        observer.observe(anchorEl);
        return () => observer.disconnect();
    }, [pickerActive, anchorRef, textareaRef]);

    /** @type {(event: KeyboardEvent) => void} */
    const handleTextareaKeyDown = (event) => {
        if (!pickerActive) return;
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                setActiveIndex((i) => clampBackward(i, filtered.length));
                return;
            case 'ArrowDown':
                event.preventDefault();
                setActiveIndex((i) => clampForward(i, filtered.length));
                return;
            case 'Enter': {
                if (event.shiftKey) return;
                event.preventDefault();
                const tab = filtered[activeIndex];
                if (tab) handleTabSelect(tab);
                return;
            }
            case 'Escape':
                event.preventDefault();
                closePicker();
                break;
        }
    };

    const activeDescendant = activeIndex >= 0 && activeIndex < filtered.length ? rowId(LISTBOX_ID, filtered[activeIndex].tabId) : null;

    /** @type {ComboboxOverride | null} */
    const combobox = pickerActive ? { listboxId: LISTBOX_ID, activeDescendantId: activeDescendant } : null;

    const pickerProps = useMemo(
        () =>
            pickerActive
                ? {
                      filtered,
                      activeIndex,
                      onActiveIndexChange: setActiveIndex,
                      onSelect: handleTabSelect,
                      listboxId: LISTBOX_ID,
                  }
                : null,
        [pickerActive, filtered, activeIndex, handleTabSelect],
    );

    return {
        pickerActive,
        handleTextareaKeyDown,
        combobox,
        pickerProps,
        handleTextChange,
        wrapperStyle: { top: `${anchorTop}px` },
    };
}

/** @param {string} listboxId @param {string} tabId */
function rowId(listboxId, tabId) {
    return `${listboxId}-${tabId}`;
}

/** @param {number} idx @param {number} len */
function clampForward(idx, len) {
    if (len === 0) return -1;
    const next = idx + 1;
    return next >= len ? 0 : next;
}

/** @param {number} idx @param {number} len */
function clampBackward(idx, len) {
    if (len === 0) return -1;
    const prev = idx - 1;
    return prev < 0 ? len - 1 : prev;
}
