import { DetectionError, FILLS, isFailure } from '../model/core.js';
import { ItemBuffer, isItemBuffer, listMembers } from '../model/lists.js';
import { compileArgs, evaluateArgs, parsePathBody, readField, readPath } from '../predicates/fields.js';
import { parseItemKeys, selectItems } from './common.js';

/**
 * @typedef {import('../model/types.js').PredicateHooks} PredicateHooks
 * @typedef {import('../predicates/fields.js').CompiledArg} CompiledArg
 * @typedef {import('../predicates/fields.js').CompiledField} CompiledField
 * @typedef {import('../predicates/predicates.js').CompiledPredicate} CompiledPredicate
 */

/**
 * @template Body
 * @typedef {import('../model/types.js').Source<Body>} Source
 */

/**
 * @typedef {object} ApiBody
 * @property {string[]} names
 * @property {CompiledArg[]} [args]
 * @property {unknown} [root] - the compiled expression giving the value `path` reads from, for `self`
 * @property {CompiledPredicate} [where]
 * @property {CompiledField} [field]
 */

/**
 * Parse an `api` body: a path, or an object of `path`, `args`, `where` and `field`. A `self` body may
 * leave out `path`, and then reads from the bound value itself.
 *
 * @param {unknown} rawBody
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @param {string} key - the expression key, for messages
 * @returns {ApiBody}
 */
export function parseApiBody(rawBody, path, hooks, key = 'api') {
    const { raw, names } = parsePathBody(rawBody, path, hooks, key, ['path', 'args', 'where', 'field']);
    /** @type {ApiBody} */
    const body = { names, ...parseItemKeys(raw, path, hooks) };
    if (raw.args !== undefined) body.args = compileArgs(raw.args, `${path}.args`, hooks);
    return body;
}

/**
 * Reads a Web API by path, from the global object or, through `self`, from a bound value, and gives
 * the value it reads. With `where`, or `field` on a list, it gives the list of the members that pass,
 * or of their values.
 *
 * @param {object} global
 * @returns {Source<ApiBody>}
 */
export function apiSource(global) {
    return {
        key: 'api',
        parse: (raw, path, hooks, key) => parseApiBody(raw, path, hooks, key),
        fills: (body) => (body.where ? FILLS.list : FILLS.any),
        read(bodies, ctx) {
            // `api` takes one body
            const body = /** @type {ApiBody} */ (bodies[0]);
            let base = body.root === undefined ? global : ctx.read(body.root);
            if (isFailure(base)) return base;
            if (isItemBuffer(base)) {
                // A selected list reaches `path` as an array
                const failure = base.pull(Infinity);
                if (failure) return failure;
                base = base.values;
            }
            const args = body.args && evaluateArgs(body.args, ctx);
            if (isFailure(args)) return args;
            const result = readPath(ctx.reader, base, body.names, args);
            if (isFailure(result)) return result;
            if (body.where || body.field) {
                const members = listMembers(result, ctx);
                if (isFailure(members)) return members;
                if (members) return new ItemBuffer(selectItems(members, body, ctx));
                if (body.where) throw new DetectionError('`where` on a value that is not a list');
            }
            return body.field ? readField(ctx, result, body.field) : result;
        },
    };
}
