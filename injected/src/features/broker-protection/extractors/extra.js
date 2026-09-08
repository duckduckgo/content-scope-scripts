import { firstString, selectStrings } from '../actions/extract.js';

/**
 * Generic text extraction for an unregistered profile field.
 *
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').TextFieldSpec} spec
 * @return {string | null}
 */
export function extractExtra(select, root, spec) {
    return firstString(selectStrings(select, root, spec)) || null;
}
