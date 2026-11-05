import { useCallback, useState } from 'preact/hooks';
import { isConvertibleTextPaste } from './textPasted.js';

/**
 * `addedAtRelative` is a `performance.now()` value used to sort attachments by attach order.
 * @typedef {{ id: string, content: string, addedAtRelative: number }} AttachedTextPasted
 */

let nextId = 0;

/**
 * Long text pastes held as attachments until submit.
 */
export function useTextPasted() {
    const [attachedTextPasted, setAttachedTextPasted] = useState(/** @type {AttachedTextPasted[]} */ ([]));

    /**
     * Attaches the text when it qualifies; otherwise the caller lets it paste inline.
     * @param {string} content
     * @param {number} threshold
     * @returns {boolean} whether it was attached
     */
    const addTextPasted = useCallback((content, threshold) => {
        if (!isConvertibleTextPaste(content, threshold)) return false;
        nextId += 1;
        const entry = { id: `text-pasted-${nextId}`, content, addedAtRelative: performance.now() };
        setAttachedTextPasted((prev) => [...prev, entry]);
        return true;
    }, []);

    /** @param {string} id */
    const removeTextPasted = useCallback((id) => {
        setAttachedTextPasted((prev) => prev.filter((entry) => entry.id !== id));
    }, []);

    const clearTextPasted = useCallback(() => setAttachedTextPasted([]), []);

    /** @returns {{ content: string }[] | undefined} undefined when there is nothing to send */
    const getTextPastedForSubmission = () =>
        attachedTextPasted.length > 0 ? attachedTextPasted.map(({ content }) => ({ content })) : undefined;

    /**
     * Paste handler: attaches a long text paste instead of inserting it.
     * @param {ClipboardEvent} event
     * @param {number} threshold
     */
    const handlePaste = (event, threshold) => {
        const text = event.clipboardData?.getData('text/plain');
        if (!text) return;
        if (addTextPasted(text, threshold)) event.preventDefault();
    };

    return { attachedTextPasted, addTextPasted, removeTextPasted, clearTextPasted, getTextPastedForSubmission, handlePaste };
}
