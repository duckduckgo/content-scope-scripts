import { isArray } from '../../../captured-globals.js';
import { ConfigParseError, isExpressionObject, isFailure, isPlainObject, rejectUnknownKeys } from '../model/core.js';

/**
 * @typedef {import('../model/core.js').Failure} Failure
 * @typedef {import('../model/types.js').ItemBinder} ItemBinder
 * @typedef {import('../model/types.js').PredicateContext} PredicateContext
 * @typedef {import('../model/types.js').PredicateHooks} PredicateHooks
 * @typedef {import('../model/types.js').Reader} Reader
 */

/**
 * A compiled `args` entry: an expression in value position.
 *
 * @typedef {{ expression: unknown }} CompiledArg
 */

/**
 * Read a path of names from a root, calling the last name with `args` when given.
 *
 * `length` on a string or an array reads it directly. A name after `null` or `undefined` gives
 * `undefined`, as `?.` does.
 *
 * @param {Reader} reader
 * @param {unknown} root
 * @param {readonly string[]} names
 * @param {readonly unknown[] | undefined} args - the evaluated arguments
 * @returns {unknown} the value, or a `Failure`
 */
export function readPath(reader, root, names, args) {
    let current = root;
    for (let i = 0; i < names.length; i++) {
        if (current === null || current === undefined) return undefined;
        const name = /** @type {string} */ (names[i]);
        if (args && i === names.length - 1) {
            current = reader.call(current, name, args);
        } else if (name === 'length' && (typeof current === 'string' || isArray(current))) {
            current = current.length;
        } else {
            current = reader.read(current, name);
        }
        if (isFailure(current)) return current;
    }
    return current;
}

/**
 * @typedef {object} CompiledField
 * @property {string} path - the config path a failed read is reported at
 * @property {string[]} names - empty for an expression
 * @property {CompiledArg[]} [args]
 * @property {unknown} [expression] - a compiled expression in value position, in place of `names` and `args`
 * @property {ItemBinder} [binder] - binds `self` in `args` or `expression` to the value the field reads from
 */

/**
 * Compile `args`: a JS array of its entries, each an expression in value position. An inner array is
 * `{"expr": [...]}`, since an array is never an expression.
 *
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledArg[]}
 */
export function compileArgs(raw, path, hooks) {
    if (!isArray(raw)) throw new ConfigParseError(path, '`args` must be an array');
    return raw.map((entry, i) => ({ expression: hooks.expression(entry, `${path}.${i}`, 'value') }));
}

/**
 * Evaluate compiled `args`.
 *
 * @param {readonly CompiledArg[]} args
 * @param {PredicateContext} ctx
 * @returns {unknown[] | Failure}
 */
export function evaluateArgs(args, ctx) {
    /** @type {unknown[]} */
    const values = [];
    for (const arg of args) {
        const value = ctx.arg(arg.expression);
        if (isFailure(value)) return value;
        values.push(value);
    }
    return values;
}

/**
 * Compile a path, adding its names to those the native reader captures.
 *
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {string[]}
 */
export function compilePath(raw, path, hooks) {
    if (typeof raw !== 'string' || raw === '') throw new ConfigParseError(path, 'a path must be a non-empty string');
    const names = raw.split('.');
    if (names.some((name) => name === '')) throw new ConfigParseError(path, `empty name in path '${raw}'`);
    names.forEach((name) => hooks.names.add(name));
    return names;
}

/**
 * Parse a body naming a path: a string, short for `{path}`, or an object of `path`, `args` and the
 * other keys allowed. The caller compiles `args`. A `self` body may leave out `path`, and then reads
 * from the bound value itself.
 *
 * @param {unknown} rawBody
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @param {string} key - the key the body sits under, for messages
 * @param {readonly string[]} allowed
 * @returns {{ raw: Record<string, unknown>, names: string[] }}
 */
export function parsePathBody(rawBody, path, hooks, key, allowed) {
    const raw = typeof rawBody === 'string' ? { path: rawBody } : rawBody;
    if (!isPlainObject(raw)) throw new ConfigParseError(path, `\`${key}\` takes a path or an object`);
    rejectUnknownKeys(raw, allowed, path);
    if (raw.path !== undefined) return { raw, names: compilePath(raw.path, `${path}.path`, hooks) };
    if (raw.args !== undefined) throw new ConfigParseError(path, '`args` needs `path`');
    if (key !== 'self') throw new ConfigParseError(path, `\`${key}\` needs \`path\``);
    return { raw, names: [] };
}

/**
 * Compile a `field`: a string, short for `{path}`, an object of `path` and `args`, or an expression. `self` in `args` or the expression is the value the field reads from.
 *
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledField}
 */
export function compileField(raw, path, hooks) {
    if (isExpressionObject(raw)) {
        return hooks.item((binder) => ({ path, names: [], binder, expression: hooks.expression(raw, path, 'value') }));
    }
    const body = parsePathBody(raw, path, hooks, 'field', ['path', 'args']);
    /** @type {CompiledField} */
    const field = { path, names: body.names };
    const rawArgs = body.raw.args;
    if (rawArgs !== undefined) {
        hooks.item((binder) => {
            field.binder = binder;
            field.args = compileArgs(rawArgs, `${path}.args`, hooks);
        });
    }
    return field;
}

/**
 * Read a compiled `field` from an item or value.
 *
 * @param {PredicateContext} ctx
 * @param {unknown} root
 * @param {CompiledField} field
 * @returns {unknown} the value, or a `Failure`
 */
export function readField(ctx, root, field) {
    const binder = field.binder;
    const value = binder ? ctx.bind(binder, root, () => readFieldOf(ctx, root, field)) : readFieldOf(ctx, root, field);
    return isFailure(value) ? value.at(field.path) : value;
}

/**
 * @param {PredicateContext} ctx
 * @param {unknown} root
 * @param {CompiledField} field
 * @returns {unknown} the value, or a `Failure`
 */
function readFieldOf(ctx, root, field) {
    // A selected list reaches the predicate as an array, as it does in `args`
    if (field.expression !== undefined) return ctx.arg(field.expression);
    const args = field.args && evaluateArgs(field.args, ctx);
    if (isFailure(args)) return args;
    return readPath(ctx.reader, root, field.names, args);
}
