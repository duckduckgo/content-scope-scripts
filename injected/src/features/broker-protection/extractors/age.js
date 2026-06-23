import { selectStrings } from '../actions/extract.js';

/**
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').TextFieldSpec} spec
 * @return {string | null}
 */
export function extractAge(select, root, spec) {
    const [first] = selectStrings(select, root, spec);
    return first?.match(/\d+/)?.[0] ?? null;
}
