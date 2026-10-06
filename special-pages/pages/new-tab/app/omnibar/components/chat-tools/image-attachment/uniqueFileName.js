/**
 * Returns `base` + `ext`, numbered ("Screenshot 2.png") when that name is already taken.
 * The image list drops duplicate names, so repeated screenshots and pastes must differ.
 *
 * @param {string} base
 * @param {string} ext - including the dot, e.g. `.png`
 * @param {Set<string>} taken
 * @returns {string}
 */
export function uniqueFileName(base, ext, taken) {
    if (!taken.has(`${base}${ext}`)) return `${base}${ext}`;
    for (let n = 2; ; n++) {
        const candidate = `${base} ${n}${ext}`;
        if (!taken.has(candidate)) return candidate;
    }
}
