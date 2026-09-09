/**
 * @file Async Clipboard API implemented on top of the deprecated `document.execCommand()`.
 *
 * Some WebViews expose no `navigator.clipboard` at all (it is also absent from insecure
 * contexts), which breaks copy/paste on sites that only implement the modern API. The
 * classes here provide the same surface, moving data through synthetic `copy`/`paste`
 * commands instead of the native clipboard bindings.
 *
 * @see injected/docs/coding-guidelines.md for general patterns
 */

const TEXT_PLAIN = 'text/plain';
const TEXT_HTML = 'text/html';

/**
 * The only formats `execCommand()` can carry, since everything travels through a
 * `DataTransfer` as a string.
 */
const SUPPORTED_TYPES = [TEXT_PLAIN, TEXT_HTML];

/**
 * Creates an offscreen editable element to act as the target of the synthetic commands.
 * `execCommand()` only operates on a focused, editable element that is part of the document.
 * @returns {HTMLTextAreaElement | null} `null` when there is no document to attach it to
 */
function createScratchElement() {
    const container = document.body || document.documentElement;
    if (!container) return null;
    const scratch = document.createElement('textarea');
    scratch.setAttribute('aria-hidden', 'true');
    scratch.setAttribute('tabindex', '-1');
    // A non-zero size keeps the element focusable, while staying invisible and outside of
    // the layout flow so the page doesn't shift or scroll when we focus it.
    scratch.style.cssText =
        'all:initial;position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;margin:0;opacity:0;pointer-events:none;';
    container.appendChild(scratch);
    return scratch;
}

/**
 * Records the current focus and selection so they can be put back after the scratch
 * element has hijacked them.
 * @returns {() => void} restores what was captured
 */
function captureSelection() {
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const selection = document.getSelection();
    /** @type {Range[]} */
    const ranges = [];
    if (selection) {
        for (let i = 0; i < selection.rangeCount; i++) {
            ranges.push(selection.getRangeAt(i).cloneRange());
        }
    }

    return () => {
        if (selection) {
            selection.removeAllRanges();
            for (const range of ranges) {
                selection.addRange(range);
            }
        }
        activeElement?.focus();
    };
}

/**
 * @param {Event} event
 * @returns {DataTransfer | null}
 */
function getClipboardData(event) {
    return /** @type {ClipboardEvent} */ (event).clipboardData;
}

/**
 * Writes the given payload to the system clipboard via `execCommand('copy')`.
 * @param {Map<string, string>} data - payload keyed by MIME type
 * @returns {boolean} whether the command was carried out
 */
export function copyWithExecCommand(data) {
    const scratch = createScratchElement();
    if (!scratch) return false;

    /** @param {Event} event */
    const onCopy = (event) => {
        const clipboardData = getClipboardData(event);
        // Without a DataTransfer we can't add the extra formats, so let the default
        // copy of the scratch element's plain text go ahead.
        if (!clipboardData) return;
        // The event is one we triggered ourselves, so replace its payload and keep it
        // away from the page's own copy handlers.
        event.preventDefault();
        event.stopImmediatePropagation();
        for (const [type, value] of data) {
            clipboardData.setData(type, value);
        }
    };

    const restoreSelection = captureSelection();
    scratch.value = data.get(TEXT_PLAIN) ?? '';
    document.addEventListener('copy', onCopy, true);

    let copied = false;
    try {
        scratch.focus();
        scratch.select();
        copied = document.execCommand('copy');
    } catch {
        copied = false;
    } finally {
        document.removeEventListener('copy', onCopy, true);
        scratch.remove();
        restoreSelection();
    }
    return copied;
}

/**
 * Reads the system clipboard via `execCommand('paste')`.
 * @returns {Map<string, string> | null} contents keyed by MIME type, or `null` when the
 * command was refused (no user activation, or the embedder disallows clipboard reads)
 */
export function pasteWithExecCommand() {
    const scratch = createScratchElement();
    if (!scratch) return null;

    // Held in an object so the value survives the callback for the reader below.
    /** @type {{ data: Map<string, string> | null }} */
    const captured = { data: null };

    /** @param {Event} event */
    const onPaste = (event) => {
        const clipboardData = getClipboardData(event);
        if (!clipboardData) return;
        // The event is one we triggered ourselves, so keep it away from the page's own
        // paste handlers. The default action still runs, filling the scratch element.
        event.stopImmediatePropagation();
        /** @type {Map<string, string>} */
        const data = new Map();
        for (const type of SUPPORTED_TYPES) {
            const value = clipboardData.getData(type);
            if (value) data.set(type, value);
        }
        captured.data = data;
    };

    const restoreSelection = captureSelection();
    document.addEventListener('paste', onPaste, true);

    let pasted = false;
    try {
        scratch.focus();
        pasted = document.execCommand('paste');
    } catch {
        pasted = false;
    } finally {
        document.removeEventListener('paste', onPaste, true);
    }

    // Engines that don't expose a DataTransfer on the synthetic event still insert the
    // text into the focused element, so read it back from there.
    const insertedText = scratch.value;
    scratch.remove();
    restoreSelection();

    if (!pasted) return null;
    return captured.data ?? new Map([[TEXT_PLAIN, insertedText]]);
}

/**
 * Reads a blob as text without depending on `Blob.text()`, which is missing in older WebViews.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToText(blob) {
    if (typeof blob.text === 'function') {
        return blob.text();
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(new DOMException('The blob could not be read.', 'NotReadableError'));
        reader.readAsText(blob);
    });
}

/**
 * Stand-in for the `ClipboardItem` interface.
 */
export class ClipboardItemImpl {
    /** @type {Map<string, Promise<Blob>>} */
    #items = new Map();

    /** @type {PresentationStyle} */
    #presentationStyle;

    /**
     * @param {Record<string, string | Blob | PromiseLike<string | Blob>>} items
     * @param {ClipboardItemOptions} [options]
     */
    constructor(items, options) {
        const entries = Object.entries(items || {});
        if (entries.length === 0) {
            throw new TypeError("Failed to construct 'ClipboardItem': Empty dictionary argument");
        }
        for (const [type, value] of entries) {
            const blob = Promise.resolve(value).then((resolved) =>
                typeof resolved === 'string' ? new Blob([resolved], { type }) : resolved,
            );
            // A caller may never ask for this type, so make sure a rejection here can't
            // surface as an unhandled promise rejection. `getType()` still rejects.
            blob.catch(() => {});
            this.#items.set(type, blob);
        }
        this.#presentationStyle = options?.presentationStyle ?? 'unspecified';
    }

    /** @returns {PresentationStyle} */
    get presentationStyle() {
        return this.#presentationStyle;
    }

    /** @returns {ReadonlyArray<string>} */
    get types() {
        return Array.from(this.#items.keys());
    }

    /**
     * @param {string} type
     * @returns {Promise<Blob>}
     */
    getType(type) {
        const blob = this.#items.get(type);
        if (!blob) {
            return Promise.reject(
                new DOMException(`Failed to execute 'getType' on 'ClipboardItem': The type '${type}' was not found`, 'NotFoundError'),
            );
        }
        return blob;
    }

    /**
     * @param {string} type
     * @returns {boolean}
     */
    static supports(type) {
        return SUPPORTED_TYPES.includes(type);
    }
}

/**
 * Stand-in for the `Clipboard` interface, backed by `document.execCommand()`.
 *
 * Note: no private class fields here — instances are exposed through a Proxy by
 * `shimProperty()`, and private field access on a Proxy throws.
 */
export class ClipboardImpl extends EventTarget {
    /**
     * @param {string} data
     * @returns {Promise<void>}
     */
    writeText(data) {
        const written = copyWithExecCommand(new Map([[TEXT_PLAIN, String(data)]]));
        if (!written) {
            return Promise.reject(new DOMException('Document is not focused.', 'NotAllowedError'));
        }
        return Promise.resolve();
    }

    /**
     * @returns {Promise<string>}
     */
    readText() {
        const data = pasteWithExecCommand();
        if (!data) {
            return Promise.reject(new DOMException('Read permission denied.', 'NotAllowedError'));
        }
        return Promise.resolve(data.get(TEXT_PLAIN) ?? '');
    }

    /**
     * @param {ClipboardItem[]} data
     * @returns {Promise<void>}
     */
    async write(data) {
        const items = Array.from(data || []);
        if (items.length !== 1) {
            throw new DOMException('Support for multiple ClipboardItems is not implemented.', 'NotAllowedError');
        }
        const [item] = items;
        if (!item) {
            throw new DOMException('Support for multiple ClipboardItems is not implemented.', 'NotAllowedError');
        }

        /** @type {Map<string, string>} */
        const payload = new Map();
        for (const type of item.types) {
            if (!SUPPORTED_TYPES.includes(type)) continue;
            payload.set(type, await blobToText(await item.getType(type)));
        }
        if (payload.size === 0) {
            throw new DOMException(`Type ${item.types[0] ?? TEXT_PLAIN} not supported on write.`, 'NotAllowedError');
        }

        if (!copyWithExecCommand(payload)) {
            throw new DOMException('Document is not focused.', 'NotAllowedError');
        }
    }

    /**
     * @returns {Promise<ClipboardItem[]>}
     */
    read() {
        const data = pasteWithExecCommand();
        if (!data) {
            return Promise.reject(new DOMException('Read permission denied.', 'NotAllowedError'));
        }

        /** @type {Record<string, Blob>} */
        const items = {};
        for (const [type, value] of data) {
            items[type] = new Blob([value], { type });
        }
        // The clipboard always reports a plain text flavour, even when it is empty.
        if (!(TEXT_PLAIN in items)) {
            items[TEXT_PLAIN] = new Blob([''], { type: TEXT_PLAIN });
        }
        return Promise.resolve([new ClipboardItemImpl(items)]);
    }
}
