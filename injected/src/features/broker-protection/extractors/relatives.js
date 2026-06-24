import { selectStrings, stringToList } from '../actions/extract.js';

/**
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').TextFieldSpec} spec
 * @return {string[]}
 */
export function extractRelatives(select, root, spec) {
    return (
        selectStrings(select, root, spec)
            .flatMap((value) => stringToList(value, spec.separator))
            // for relatives, remove anything following a comma (usually 'age')
            // eg: 'John Smith, 39' -> 'John Smith'
            .map((value) => /** @type {string} */ (value.split(',')[0]))
    );
}
