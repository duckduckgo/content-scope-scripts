/**
 * Native pairs a contextMenuOpened report with its own context menu event by this key of the selection as the browser
 * reports it. The report's text leaves out hidden text and the browser's doesn't, so the two texts alone can differ.
 * The 32-bit FNV-1a hash over UTF-16 code units, once each run of whitespace is one space and the ends are trimmed, as
 * 8 lowercase hex digits.
 * @param {string} text
 * @returns {string}
 */
export function selectedTextKey(text) {
    const collapsed = text.replace(/\s+/g, ' ').trim();
    let hash = 0x811c9dc5;
    for (let i = 0; i < collapsed.length; i++) {
        hash = Math.imul(hash ^ collapsed.charCodeAt(i), 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}
