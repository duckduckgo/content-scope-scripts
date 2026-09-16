import { parseURL } from '../../../utils.js';

/**
 * e.g. `1.4 MB`. Unlocalized, like the file-type abbreviations beside it.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unitIndex]}`;
}

/**
 * Splits a filename into its stem and extension. Dotfiles and extensionless names
 * return an empty extension.
 * @param {string} filename
 * @returns {{ stem: string, extension: string }}
 */
export function splitFileName(filename) {
    const dotIndex = filename.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex === filename.length - 1) {
        return { stem: filename, extension: '' };
    }
    return { stem: filename.slice(0, dotIndex), extension: filename.slice(dotIndex) };
}

/**
 * Decoded byte length of a base64 string, so attached files can show a size
 * without persisting one.
 * @param {string} data
 * @returns {number}
 */
export function base64ByteLength(data) {
    if (!data) return 0;
    let padding = 0;
    if (data.endsWith('==')) padding = 2;
    else if (data.endsWith('=')) padding = 1;
    return Math.floor((data.length * 3) / 4) - padding;
}

/**
 * Host for display, without a leading `www.`; falls back to the raw string.
 * @param {string} url
 * @returns {string}
 */
export function getDomainForDisplay(url) {
    const parsed = parseURL(url);
    if (!parsed || !parsed.host) return url;
    return parsed.host.replace(/^www\./i, '');
}
