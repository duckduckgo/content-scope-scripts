export function getActiveSelectionLanguage() {
    // BCP 47 language tag regex
    const bcp47 =
        /^(?:en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE|art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang|(?<langtag>(?<language>[A-Za-z]{2,3}(?<extlang>-[A-Za-z]{3}(-[A-Za-z]{3}){0,2})?|[A-Za-z]{4,8})(?:-(?<script>[A-Za-z]{4}))?(?:-(?<region>[A-Za-z]{2}|[0-9]{3}))?(?<variants>(?:-(?:[0-9A-Za-z]{5,8}|[0-9][0-9A-Za-z]{3}))*)(?<extensions>(?:-(?:[0-9A-WY-Za-wy-z](?:-[0-9A-Za-z]{2,8})+))*)(?:-(?<privateuse>x(?:-[0-9A-Za-z]{1,8})+))?)|(?<privateuse>x(?:-[0-9A-Za-z]{1,8})+))$/gim;

    // Get the Selection from the currently focused document (top or same-origin iframe)
    function getActiveSelection() {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'IFRAME') {
            try {
                // Type assertion to access contentWindow safely
                const iframe = /** @type {HTMLIFrameElement} */ (activeElement);
                return iframe.contentWindow?.getSelection() || null;
            } catch {
                // Cross-origin iframe: cannot access its selection
            }
        }
        return window.getSelection?.() || null;
    }

    const selection = getActiveSelection();
    const startContainer = selection?.rangeCount ? selection.getRangeAt(0).startContainer : null;

    // If no selection, use the document's lang (or null if absent)
    if (!startContainer) {
        return document.documentElement.getAttribute('lang') || null;
    }

    // If the start is a text node, step up to its parent element
    const startElement =
        startContainer.nodeType === Node.ELEMENT_NODE ? /** @type {Element} */ (startContainer) : startContainer.parentElement;

    // Look up the DOM tree for a lang attribute; fallback to the document's lang
    const lang = startElement?.closest('[lang]')?.getAttribute('lang') || document.documentElement.getAttribute('lang');

    // Validate the lang attribute against the BCP 47 regex
    if (lang && bcp47.test(lang)) return lang;

    return null;
}
