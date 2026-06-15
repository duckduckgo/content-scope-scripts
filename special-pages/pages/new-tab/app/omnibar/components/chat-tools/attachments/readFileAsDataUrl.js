export const FILE_READ_TIMEOUT = 30000;

/**
 * Reads a `File` as a data URL, rejecting if it errors or exceeds `timeoutMs`.
 * @param {File} file
 * @param {number} timeoutMs
 * @returns {Promise<string>}
 */
export function readFileAsDataUrl(file, timeoutMs) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        const timeoutId = setTimeout(() => {
            reader.abort();
            reject(new Error(`File reading timed out after ${timeoutMs / 1000} seconds`));
        }, timeoutMs);

        reader.onload = () => {
            clearTimeout(timeoutId);
            resolve(/** @type {string} */ (reader.result));
        };

        reader.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}
