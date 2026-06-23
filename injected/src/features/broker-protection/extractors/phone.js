import { selectStrings, stringToList } from '../actions/extract.js';

/**
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').TextFieldSpec} spec
 * @return {string[]}
 */
export function extractPhone(select, root, spec) {
    return selectStrings(select, root, spec)
        .flatMap((str) => stringToList(str, spec.separator))
        .map((str) => str.replace(/\D/g, ''));
}
