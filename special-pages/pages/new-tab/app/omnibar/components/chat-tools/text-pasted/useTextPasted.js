import { useCallback } from 'preact/hooks';
import { useMessaging } from '../../../../types.js';
import { TextPastedAttachments } from '../../PersistentOmnibarValuesProvider';
import { isConvertibleTextPaste } from './textPasted.js';

/**
 * `addedAtRelative` is a `performance.now()` value used to sort attachments by attach order.
 * @typedef {{ id: string, content: string, addedAtRelative: number }} AttachedTextPasted
 */

let nextId = 0;

const { useStateWithLocalPersistence } = TextPastedAttachments;

/**
 * Long text pastes held as attachments until submit, per NTP tab so they survive switching tabs
 * like the other attachments. Sends `omnibar_pasted_text_attached`, `_removed` and `_edited` for
 * the user's own actions; clearing on submit sends nothing.
 * @param {object} [params]
 * @param {string|null|undefined} [params.tabId] - NTP tab the pastes are persisted under.
 */
export function useTextPasted({ tabId } = {}) {
    const ntp = useMessaging();
    const [attachedTextPasted, setAttachedTextPasted] = useStateWithLocalPersistence(tabId);

    /**
     * Attaches the text when it qualifies; otherwise the caller lets it paste inline.
     * @param {string} content
     * @param {number} threshold
     * @returns {boolean} whether it was attached
     */
    const addTextPasted = useCallback(
        (content, threshold) => {
            if (!isConvertibleTextPaste(content, threshold)) return false;
            nextId += 1;
            const entry = { id: `text-pasted-${nextId}`, content, addedAtRelative: performance.now() };
            setAttachedTextPasted((prev) => [...prev, entry]);
            ntp.telemetryEvent({ attributes: { name: 'omnibar_pasted_text_attached' } });
            return true;
        },
        [ntp, setAttachedTextPasted],
    );

    /** @param {string} id */
    const removeTextPasted = useCallback(
        (id) => {
            setAttachedTextPasted((prev) => prev.filter((entry) => entry.id !== id));
            ntp.telemetryEvent({ attributes: { name: 'omnibar_pasted_text_removed' } });
        },
        [ntp, setAttachedTextPasted],
    );

    /**
     * Replaces a paste's text after an edit; it keeps its place in the attach order.
     * Callers only call it when the text changed, so each call is one edit.
     * @param {string} id
     * @param {string} content
     */
    const updateTextPasted = useCallback(
        (id, content) => {
            setAttachedTextPasted((prev) => prev.map((entry) => (entry.id === id ? { ...entry, content } : entry)));
            ntp.telemetryEvent({ attributes: { name: 'omnibar_pasted_text_edited' } });
        },
        [ntp, setAttachedTextPasted],
    );

    const clearTextPasted = useCallback(() => setAttachedTextPasted([]), [setAttachedTextPasted]);

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

    return {
        attachedTextPasted,
        addTextPasted,
        removeTextPasted,
        updateTextPasted,
        clearTextPasted,
        getTextPastedForSubmission,
        handlePaste,
    };
}
