import { selectStrings, stringToList } from '../actions/extract.js';

/**
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').TextFieldSpec} spec
 * @return {string | null}
 */
export function extractName(select, root, spec) {
    const [first] = selectStrings(select, root, spec);
    return first ? first.replace(/\n/g, ' ').trim() : null;
}

/**
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').TextFieldSpec} spec
 * @return {string[]}
 */
export function extractAlternativeNames(select, root, spec) {
    return selectStrings(select, root, spec).flatMap((value) => stringToList(value, spec.separator));
}
