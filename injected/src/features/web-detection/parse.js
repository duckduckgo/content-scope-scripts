import { isArray, objectKeys } from '../../captured-globals.js';
import {
    ACTION_KEYS,
    ConfigParseError,
    DEFINE_NAME_PATTERN,
    EXPRESSION_KEYS,
    FILLS,
    NAME_PATTERN,
    asArray,
    isExpressionObject,
    isPlainObject,
    isScalar,
    rejectUnknownKeys,
} from './core.js';
import { elementSource, textSource } from './matching.js';
import { compilePredicate } from './predicates.js';
import { apiSource, parseApiBody } from './sources.js';

/**
 * @typedef {import('../../utils.js').FeatureState} FeatureState
 * @typedef {import('../../config-feature.js').ConditionBlockOrArray} ConditionBlockOrArray
 * @typedef {import('./expressions.js').Node} Node
 * @typedef {import('./expressions.js').NodeBase} NodeBase
 * @typedef {import('./expressions.js').SourceNode} SourceNode
 * @typedef {import('./expressions.js').IfNode} IfNode
 * @typedef {import('./expressions.js').ItemBinder} ItemBinder
 * @typedef {import('./expressions.js').ItemNode} ItemNode
 * @typedef {import('./expressions.js').Position} Position
 * @typedef {import('./expressions.js').CompiledPayloadField} CompiledPayloadField
 */

/**
 * @template Body
 * @typedef {import('./sources.js').Source<Body>} Source
 */

/**
 * @typedef {import('./sources.js').ApiBody} ApiBody
 */

/**
 * Raw detector config. `match` and `actions` are read as `unknown` and validated by the compiler,
 * since the pinned privacy-configuration schema predates them.
 *
 * @typedef {object} RawDetectorConfig
 * @property {FeatureState} [state]
 * @property {RawTriggers} [triggers]
 * @property {unknown} [match] - an expression in boolean position
 * @property {unknown} [actions] - an expression, or a sequence of them
 */

/**
 * @typedef {object} RawTriggers
 * @property {{ state?: FeatureState, runConditions?: unknown }} [breakageReport]
 * @property {{ state?: FeatureState, runConditions?: unknown, when?: { intervalMs: number[] } }} [auto]
 */

/**
 * Base properties supported by all triggers.
 *
 * @typedef {object} TriggerBase
 * @property {FeatureState} state - Whether this trigger is enabled
 * @property {import('../../config-feature.js').ConditionBlockOrArray} [runConditions] - Conditions that must be met to run
 */

/**
 * @typedef {TriggerBase & {
 *  when: {
 *    intervalMs: number[];
 *  };
 * }} AutoTrigger
 */

/**
 * @typedef {object} Triggers
 * @property {TriggerBase} breakageReport - Whether to run in the breakage report flow
 * @property {AutoTrigger} auto - Whether to run automatically at specified intervals
 */

/**
 * Normalized detector configuration.
 *
 * Every optional field from the raw config is resolved to a concrete value.
 * Consumers never need fallback defaults.
 *
 * @typedef {object} DetectorConfig
 * @property {FeatureState} state - Whether the detector is enabled
 * @property {CompiledDetector | { error: string }} compiled - `match` and `actions` compiled, or why they failed to parse
 * @property {Triggers} triggers - Trigger configurations
 */

/**
 * A detector's `match` and `actions`, compiled.
 *
 * @typedef {object} CompiledDetector
 * @property {Node} [match] - in boolean position
 * @property {Node} actions - in value position
 * @property {Set<string>} names - every name config reads or calls, for the native reader
 */

const MODIFIER_KEYS = new Set(['using', 'is']);
/** Keys valid only beside `if`. */
const BRANCH_KEYS = new Set(['then', 'else']);
/** Keys reserved for later extensions, rejected by this release. */
const RESERVED_LATER = new Set(['aggregate', 'stable', 'confirm', 'retain']);

/**
 * The position of an operand of `sum` and `mul`, or of `any`, `all` and `none`, is
 * decided once every expression is compiled: `spread` when the operand can give a list.
 *
 * @typedef {{ node: Node, single: 'number' | 'boolean' }} Slot
 */

class Scope {
    /** @type {Node[]} */
    nodes = [];
    /** @type {Slot[]} */
    slots = [];
    /** @type {Map<Node, Node[]>} each node's dependencies, for marking the expressions computed per item */
    deps = new Map();
    /** @type {Node[][]} where operands compiled inside predicates are recorded as dependencies */
    operandSinks = [];
    /** @type {Set<string>} */
    readerNames = new Set();
    /** @type {ItemBinder[]} the `using`, `where` and `field` binding `self` around the expression being compiled, innermost last */
    bindings = [];
    /** @type {ItemBinder[][]} where the `where` and `field` binders a source's bodies create are recorded */
    binderSinks = [];

    /**
     * @param {Record<string, Source<any>>} sources
     */
    constructor(sources) {
        this.sources = sources;
        /** @type {import('./predicates.js').PredicateHooks} */
        this.hooks = {
            names: this.readerNames,
            expression: (raw, path, position) => {
                const node = compileExpr(raw, position, path, this);
                this.operandSinks[this.operandSinks.length - 1]?.push(node);
                return node;
            },
            item: (fn) => {
                /** @type {ItemBinder} */
                const binder = {};
                this.binderSinks[this.binderSinks.length - 1]?.push(binder);
                return within(this.bindings, binder, () => fn(binder));
            },
        };
    }

    /** The innermost `using`, `where` or `field` enclosing the expression being compiled. */
    get itemBinder() {
        return this.bindings[this.bindings.length - 1];
    }
}

/**
 * Run `fn` with `entry` innermost on `stack`: a binding of `self`, or the node recording the operands
 * predicates compile as its dependencies.
 *
 * @template E, T
 * @param {E[]} stack
 * @param {E} entry
 * @param {() => T} fn
 * @returns {T}
 */
function within(stack, entry, fn) {
    stack.push(entry);
    try {
        return fn();
    } finally {
        stack.pop();
    }
}

/**
 * @param {Scope} scope
 * @param {NodeBase & Record<string, unknown>} fields
 * @param {Node[]} deps
 * @returns {any}
 */
function makeNode(scope, fields, deps) {
    const binder = scope.itemBinder;
    const node = /** @type {Node} */ ({ ...(binder && { binder }), ...fields });
    scope.nodes.push(node);
    // Copied: operands a predicate compiles are added to the deps later, and are not operands
    scope.deps.set(node, [...deps]);
    return node;
}

/**
 * Compile the body of `actions`, `then` or `else`: an expression, or an array of them, which is a
 * sequence. Every element but the last is in value position.
 *
 * @param {unknown} raw
 * @param {Position} position
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node}
 */
function compileBody(raw, position, path, scope) {
    if (!isArray(raw)) return compileExpr(raw, position, path, scope);
    if (raw.length === 0) throw new ConfigParseError(path, 'a sequence holds at least one element');
    const elements = raw.map((element, i) => compileExpr(element, i === raw.length - 1 ? position : 'value', `${path}.${i}`, scope));
    return makeNode(scope, { kind: 'sequence', elements, path, position }, elements);
}

/**
 * Compile an expression in a position. `path` is the config path of the expression object, and each
 * node takes the path of the key it compiles from.
 *
 * @param {unknown} raw
 * @param {Position} position
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node}
 */
function compileExpr(raw, position, path, scope) {
    if (isScalar(raw)) {
        return makeNode(scope, { kind: 'literal', value: raw, path, position }, []);
    }
    if (isArray(raw)) {
        // The key holding an array decides what it means, and an array is never an expression
        throw new ConfigParseError(path, 'an array is not an expression: `{"expr": [...]}` gives a list, and `{"any": [...]}` an OR');
    }
    if (!isPlainObject(raw)) throw new ConfigParseError(path, 'expected an expression');

    const keys = objectKeys(raw);
    if (keys.some((key) => ACTION_KEYS.has(key))) return compileActions(raw, keys, position, path, scope);
    /** @type {string[]} */
    const expressionKeys = [];
    for (const key of keys) {
        if (EXPRESSION_KEYS.has(key)) expressionKeys.push(key);
        else if (RESERVED_LATER.has(key)) throw new ConfigParseError(`${path}.${key}`, `'${key}' is reserved`);
        else if (BRANCH_KEYS.has(key)) {
            if (raw.if === undefined) throw new ConfigParseError(`${path}.${key}`, `'${key}' sits beside 'if' only`);
        } else if (!MODIFIER_KEYS.has(key)) throw new ConfigParseError(`${path}.${key}`, `unknown expression key '${key}'`);
    }
    if (raw.if !== undefined && expressionKeys.length > 1) {
        throw new ConfigParseError(path, `'if' takes no other expression key beside it`);
    }

    const hasIs = raw.is !== undefined;
    const hasUsing = raw.using !== undefined;
    if (hasIs && position !== 'boolean' && position !== 'value')
        throw new ConfigParseError(path, '`is` gives a boolean, in boolean or value position');
    // With `is`, the expression computes a value for the predicate
    const valuePosition = hasIs ? 'value' : position;
    // With `using`, the expression keys give the value `using` reads from
    const keyPosition = hasUsing ? 'value' : valuePosition;

    /** @type {Node} */
    let node;
    if (expressionKeys.length === 0) {
        if (hasUsing) throw new ConfigParseError(path, '`using` reads from an expression, and this object has no expression key');
        if (hasIs || position !== 'boolean') throw new ConfigParseError(path, 'no expression key');
        // An object ANDs its keys, so no keys holds
        node = makeNode(scope, { kind: 'literal', value: true, path, position }, []);
    } else if (expressionKeys.length > 1) {
        if ((hasIs && !hasUsing) || (keyPosition !== 'boolean' && keyPosition !== 'value')) {
            throw new ConfigParseError(path, 'several expression keys are their AND, in boolean or value position and never beside `is`');
        }
        const operands = expressionKeys.map((key) => compileKey(key, raw[key], 'boolean', `${path}.${key}`, scope));
        node = makeNode(scope, { kind: 'and', operands, path, position: keyPosition }, operands);
    } else {
        const key = /** @type {string} */ (expressionKeys[0]);
        node = key === 'if' ? compileIf(raw, keyPosition, path, scope) : compileKey(key, raw[key], keyPosition, `${path}.${key}`, scope);
    }
    if (hasUsing) node = compileUsing(raw.using, node, valuePosition, path, scope);

    if (hasIs) {
        const sink = /** @type {Node[]} */ (scope.deps.get(node));
        node.is = within(scope.operandSinks, sink, () => compilePredicate(raw.is, 'value', `${path}.is`, scope.hooks));
        // Value-position reads skip `is`, and an `expr` over it gives its boolean
        if (position === 'value') return makeNode(scope, { kind: 'expr', operand: node, path, position }, [node]);
    }
    return node;
}

/**
 * An object of action keys, run in the order config lists them: one action, or a sequence of them.
 * A `define` with several names is one `define` per name, in order.
 *
 * @param {Record<string, unknown>} raw
 * @param {string[]} keys
 * @param {Position} position
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node}
 */
function compileActions(raw, keys, position, path, scope) {
    const other = keys.find((key) => !ACTION_KEYS.has(key));
    if (other !== undefined) {
        throw new ConfigParseError(
            `${path}.${other}`,
            `an action sits beside no expression key or modifier, and '${other}' is not an action`,
        );
    }
    /** @type {Node[]} */
    const actions = [];
    for (const key of keys) {
        const actionPath = `${path}.${key}`;
        if (key === 'define') actions.push(...compileDefine(raw.define, actionPath, scope));
        else actions.push(compileAction(/** @type {'fireEvent' | 'breakageReportData'} */ (key), raw[key], actionPath, scope));
    }
    /** @type {Node} */
    const node = actions.length === 1 ? actions[0] : makeNode(scope, { kind: 'sequence', elements: actions, path, position }, actions);
    // Checked once every expression is compiled: an action fills value position only
    node.position = position;
    return node;
}

/**
 * @param {unknown} raw
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node[]}
 */
function compileDefine(raw, path, scope) {
    if (!isPlainObject(raw) || objectKeys(raw).length === 0)
        throw new ConfigParseError(path, '`define` takes an object of at least one name');
    return objectKeys(raw).map((name) => {
        const namePath = `${path}.${name}`;
        if (!DEFINE_NAME_PATTERN.test(name)) throw new ConfigParseError(namePath, `invalid name '${name}'`);
        const value = compileExpr(raw[name], 'value', namePath, scope);
        return makeNode(scope, { kind: 'define', name, value, path: namePath, position: 'value' }, [value]);
    });
}

/**
 * @param {'fireEvent' | 'breakageReportData'} key
 * @param {unknown} raw
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node}
 */
function compileAction(key, raw, path, scope) {
    if (!isPlainObject(raw)) throw new ConfigParseError(path, `\`${key}\` takes an object`);
    rejectUnknownKeys(raw, key === 'fireEvent' ? ['type', 'data'] : ['data'], path);
    if (key === 'fireEvent' && typeof raw.type !== 'string') throw new ConfigParseError(`${path}.type`, '`type` takes a string');
    const data = raw.data === undefined ? undefined : compilePayload(raw.data, `${path}.data`, scope);
    const operands = data ? data.map((field) => field.value) : [];
    return makeNode(
        scope,
        { kind: key, ...(key === 'fireEvent' && { type: raw.type }), ...(data && { data }), path, position: 'value' },
        operands,
    );
}

/**
 * @param {string} key
 * @param {unknown} body
 * @param {Position} position
 * @param {string} path - the config path of the key
 * @param {Scope} scope
 * @returns {Node}
 */
function compileKey(key, body, position, path, scope) {
    switch (key) {
        case 'element':
        case 'text':
        case 'api':
            return compileSource(key, body, position, path, scope);
        case 'self':
            return compileSelf(body, position, path, scope);
        case 'expr': {
            if (isArray(body)) {
                // A list of the entries' values
                const entries = body.map((raw, i) => compileExpr(raw, 'value', `${path}.${i}`, scope));
                return makeNode(scope, { kind: 'list', entries, path, position }, entries);
            }
            // An operand with `is` gives a boolean
            const operandIs = isPlainObject(body) && body.is !== undefined;
            const operand = compileExpr(body, operandIs ? 'boolean' : position, path, scope);
            return makeNode(scope, { kind: 'expr', operand, path, position }, [operand]);
        }
        case 'only': {
            const operand = compileExpr(body, 'list', path, scope);
            return makeNode(scope, { kind: 'only', operand, path, position }, [operand]);
        }
        case 'sum':
        case 'mul': {
            const operands = asArray(body).map((raw, i) => {
                const operand = compileExpr(raw, 'number', isArray(body) ? `${path}.${i}` : path, scope);
                scope.slots.push({ node: operand, single: 'number' });
                return operand;
            });
            return makeNode(scope, { kind: key, operands, path, position }, operands);
        }
        case 'div': {
            if (!isArray(body) || body.length !== 2) throw new ConfigParseError(path, `'div' takes two operands`);
            const operands = body.map((raw, i) => compileExpr(raw, 'number', `${path}.${i}`, scope));
            return makeNode(scope, { kind: key, operands, path, position }, operands);
        }
        case 'any':
        case 'all':
        case 'none': {
            const operands = asArray(body).map((raw, i) => {
                const operand = compileExpr(raw, 'boolean', isArray(body) ? `${path}.${i}` : path, scope);
                if (!operand.is) scope.slots.push({ node: operand, single: 'boolean' });
                return operand;
            });
            return makeNode(scope, { kind: key, operands, path, position }, operands);
        }
        case 'ref':
            // The name is read when evaluation reaches it: config decides what is bound then
            if (typeof body !== 'string') throw new ConfigParseError(path, '`ref` takes a name');
            return makeNode(scope, { kind: 'ref', name: body, path, position }, []);
        default:
            throw new ConfigParseError(path, `unknown expression key '${key}'`);
    }
}

/**
 * `{"if": C, "then": X, "else"?: Y}`: the branch the condition takes, or `undefined` with no branch
 * taken, so an `if` without `else` fills value position only.
 *
 * @param {Record<string, unknown>} raw
 * @param {Position} position
 * @param {string} path
 * @param {Scope} scope
 * @returns {IfNode}
 */
function compileIf(raw, position, path, scope) {
    const ifPath = `${path}.if`;
    if (position === 'list') throw new ConfigParseError(ifPath, `'if' does not fill list position`);
    if (raw.then === undefined) throw new ConfigParseError(ifPath, `'if' needs 'then'`);
    const test = compileExpr(raw.if, 'boolean', ifPath, scope);
    const then = compileBody(raw.then, position, `${path}.then`, scope);
    const otherwise = raw.else === undefined ? undefined : compileBody(raw.else, position, `${path}.else`, scope);
    return makeNode(
        scope,
        { kind: 'if', test, then, ...(otherwise && { else: otherwise }), path: ifPath, position },
        otherwise ? [test, then, otherwise] : [test, then],
    );
}

/**
 * `using`: an expression over the value of the expression beside it, which `self` reads. A path or an
 * `api` body is short for a `self` with that body. The value is computed once, and bound for every
 * `self` reading it.
 *
 * @param {unknown} raw
 * @param {Node} root - the expression `using` reads from, in value position
 * @param {Position} position
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node}
 */
function compileUsing(raw, root, position, path, scope) {
    const usingPath = `${path}.using`;
    if (isPlainObject(raw) && objectKeys(raw).length === 0) throw new ConfigParseError(usingPath, '`using` needs `path` or an expression');
    /** @type {ItemBinder} */
    const binder = {};
    const operand = within(scope.bindings, binder, () => {
        if (!isExpressionObject(raw)) return compileSelf(raw, position, usingPath, scope, 'using');
        // An operand with `is` gives a boolean, in boolean position
        return compileExpr(raw, raw.is !== undefined ? 'boolean' : position, usingPath, scope);
    });
    // Its own node, so the `is` beside `using` is not the operand's
    return makeNode(scope, { kind: 'using', root, operand, binds: binder, path: usingPath, position }, [operand, root]);
}

/**
 * `self`: a read from the value the innermost `using`, `where` or `field` binds, as an `api` reads from
 * the global object. `{}` is the value itself, and `length` alone a `length` node.
 *
 * @param {unknown} raw
 * @param {Position} position
 * @param {string} path - the config path of the body
 * @param {Scope} scope
 * @param {string} [key] - the key the body sits under, for messages
 * @returns {Node}
 */
function compileSelf(raw, position, path, scope, key = 'self') {
    const binder = scope.itemBinder;
    if (!binder) throw new ConfigParseError(path, '`self` reads from `using`, `where` or `field`, and none encloses it');
    const root = itemNode(binder, scope);
    if (isPlainObject(raw) && objectKeys(raw).length === 0) {
        return makeNode(scope, { kind: 'expr', operand: root, path, position }, [root]);
    }
    if (raw === 'length' || (isPlainObject(raw) && raw.path === 'length' && objectKeys(raw).length === 1)) {
        scope.readerNames.add('length');
        return makeNode(scope, { kind: 'length', operand: root, path, position }, [root]);
    }
    const source = /** @type {Source<ApiBody>} */ (scope.sources.api);
    /** @type {Node[]} */
    const deps = [root];
    /** @type {ItemBinder[]} */
    const binders = [];
    const parsed = within(scope.binderSinks, binders, () =>
        within(scope.operandSinks, deps, () => parseApiBody(raw, path, scope.hooks, key === 'using' ? 'using' : 'self')),
    );
    parsed.root = root;
    return makeNode(scope, { kind: 'source', source, bodies: [parsed], binders, path, position }, deps);
}

/**
 * The node giving the value a `using`, `where` or `field` binds, one per binder.
 *
 * @param {ItemBinder} binder
 * @param {Scope} scope
 * @returns {ItemNode}
 */
function itemNode(binder, scope) {
    if (!binder.node) {
        /** @type {ItemNode} */
        const node = makeNode(scope, { kind: 'item', path: '', position: 'value' }, []);
        node.perItem = true;
        binder.node = node;
    }
    return binder.node;
}

/**
 * @param {'element' | 'text' | 'api'} key
 * @param {unknown} body
 * @param {Position} position
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node}
 */
function compileSource(key, body, position, path, scope) {
    const source = /** @type {Source<any>} */ (scope.sources[key]);
    if (key === 'api' && isArray(body)) throw new ConfigParseError(path, '`api` takes one body');
    /** @type {Node[]} */
    const deps = [];
    /** @type {ItemBinder[]} */
    const binders = [];
    const bodies = within(scope.binderSinks, binders, () =>
        within(scope.operandSinks, deps, () =>
            asArray(body).map((raw, i) => source.parse(raw, isArray(body) ? `${path}.${i}` : path, scope.hooks)),
        ),
    );
    if (bodies.length === 0) throw new ConfigParseError(path, 'no bodies');
    return makeNode(scope, { kind: 'source', source, bodies, binders, path, position }, deps);
}

/**
 * The positions an expression fills.
 *
 * @param {Node} node
 * @returns {ReadonlySet<Position>}
 */
function fillsOf(node) {
    switch (node.kind) {
        case 'literal':
            if (typeof node.value === 'number') return FILLS.number;
            return typeof node.value === 'boolean' ? FILLS.boolean : FILLS.value;
        case 'source': {
            const [first, ...rest] = node.bodies.map((body) => node.source.fills(body));
            return new Set([...(first ?? [])].filter((position) => rest.every((fills) => fills.has(position))));
        }
        case 'length':
        case 'only':
        case 'sum':
        case 'mul':
        case 'div':
            return FILLS.number;
        case 'any':
        case 'all':
        case 'none':
        case 'and':
            return FILLS.boolean;
        case 'if': {
            // With no branch taken, `undefined`, which fills value position only
            const elseFills = node.else ? occurrenceFills(node.else) : FILLS.value;
            return new Set([...occurrenceFills(node.then)].filter((p) => elseFills.has(p) && p !== 'list'));
        }
        case 'sequence':
            return occurrenceFills(/** @type {Node} */ (node.elements[node.elements.length - 1]));
        case 'ref':
        case 'item':
            // A bound value may be any value, and is checked where it is read
            return FILLS.any;
        case 'expr':
        case 'using':
            return occurrenceFills(node.operand);
        case 'list':
            return FILLS.array;
        case 'define':
        case 'fireEvent':
        case 'breakageReportData':
            // An action gives `undefined`
            return FILLS.value;
    }
}

/**
 * The positions an expression fills where it sits: with `is`, a boolean.
 *
 * @param {Node} node
 * @returns {ReadonlySet<Position>}
 */
function occurrenceFills(node) {
    return node.is ? FILLS.boolean : fillsOf(node);
}

/**
 * Mark the expressions computed per item: those reading `self` of the `using`, `where` or `field` they
 * sit in. One reading no `self` inside a `where` is computed once per evaluation of the source.
 *
 * @param {Scope} scope
 */
function markPerItem(scope) {
    /** @type {Map<Node, boolean>} */
    const marked = new Map();
    /**
     * @param {Node} node
     * @returns {boolean}
     */
    const visit = (node) => {
        const seen = marked.get(node);
        if (seen !== undefined) return seen;
        const perItem =
            node.kind === 'item' ||
            (node.binder !== undefined && (scope.deps.get(node) ?? []).some((dep) => dep.binder === node.binder && visit(dep)));
        marked.set(node, perItem);
        if (perItem) node.perItem = true;
        return perItem;
    };
    scope.nodes.forEach(visit);
}

/**
 * Settle each operand slot's position, then check every expression fills its position.
 *
 * @param {Scope} scope
 */
function finish(scope) {
    markPerItem(scope);
    for (const { node, single } of scope.slots) {
        // `element` without `field` and `text` are the condition leaf under any / all / none: a boolean
        const leaf = single === 'boolean' && isPresenceLeaf(node);
        node.position = fillsOf(node).has('list') && !leaf ? 'spread' : single;
        node.single = single;
    }
    for (const node of scope.nodes) {
        if (!fits(fillsOf(node), node.position)) {
            const what =
                node.kind === 'source'
                    ? `'${/** @type {SourceNode} */ (node).source.key}'${node.bodies.some((b) => /** @type {any} */ (b).field) ? ' with field' : ''}`
                    : `'${node.kind}'`;
            const hint =
                node.position === 'boolean' && fillsOf(node).has('number')
                    ? '; numbers become booleans only through `is`'
                    : node.kind === 'if' && !node.else
                      ? '; without `else` it gives `undefined` when the condition does not hold'
                      : '';
            throw new ConfigParseError(node.path, `${what} does not fill ${node.position} position${hint}`);
        }
    }
}

/**
 * Whether an expression is the condition leaf: `element` without `field`, or `text`, directly or
 * through `expr`.
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isPresenceLeaf(node) {
    let current = node;
    while ((current.kind === 'expr' || current.kind === 'using') && !current.operand.is) current = current.operand;
    if (current.kind !== 'source') return false;
    const key = current.source.key;
    return key === 'text' || (key === 'element' && current.bodies.every((body) => !(/** @type {{ field?: unknown }} */ (body).field)));
}

/**
 * @param {ReadonlySet<Position>} fills
 * @param {Position} position
 * @returns {boolean}
 */
function fits(fills, position) {
    if (position === 'spread') return fills.has('list');
    if (position === 'root') return fills.has('list') || fills.has('value');
    return fills.has(position);
}

/**
 * @param {unknown} raw
 * @param {string} path
 * @param {Scope} scope
 * @returns {CompiledPayloadField[]}
 */
function compilePayload(raw, path, scope) {
    if (!isPlainObject(raw)) throw new ConfigParseError(path, '`data` takes an object');
    return objectKeys(raw).map((key) => {
        const fieldPath = `${path}.${key}`;
        if (!NAME_PATTERN.test(key) || key === 'nativeData') throw new ConfigParseError(fieldPath, `invalid payload key '${key}'`);
        const spec = raw[key];
        if (!isPlainObject(spec)) throw new ConfigParseError(fieldPath, 'a payload field takes an object');
        rejectUnknownKeys(spec, ['value', 'when', 'buckets'], fieldPath);
        if (spec.value === undefined) throw new ConfigParseError(fieldPath, 'a payload field needs `value`');
        const value = compileExpr(spec.value, 'value', `${fieldPath}.value`, scope);
        /** @type {CompiledPayloadField} */
        const field = { key, path: fieldPath, value };
        /** @type {Node[]} */
        const deps = [];
        within(scope.operandSinks, deps, () => {
            if (spec.when !== undefined) field.when = compilePredicate(spec.when, 'value', `${fieldPath}.when`, scope.hooks);
            if (spec.buckets !== undefined) {
                const buckets = spec.buckets;
                if (!isPlainObject(buckets) || objectKeys(buckets).length === 0) {
                    throw new ConfigParseError(`${fieldPath}.buckets`, '`buckets` takes an object of at least one bucket');
                }
                field.buckets = objectKeys(buckets).map((name) => [
                    name,
                    compilePredicate(buckets[name], 'value', `${fieldPath}.buckets.${name}`, scope.hooks),
                ]);
            }
        });
        return field;
    });
}

const DETECTOR_KEYS = ['state', 'triggers', 'match', 'actions'];

/**
 * Compile a detector's `match` and `actions`. Names are not checked: a `ref` reads whatever binding
 * exists when evaluation reaches it.
 *
 * @param {RawDetectorConfig} config
 * @param {object} global - the global object `api` reads from
 * @returns {CompiledDetector} throws a `ConfigParseError`
 */
export function compileDetector(config, global) {
    if (!isPlainObject(config)) throw new ConfigParseError('detector', 'a detector takes an object');
    rejectUnknownKeys(config, DETECTOR_KEYS, 'detector');
    if (config.actions === undefined) throw new ConfigParseError('actions', 'a detector needs `actions`');
    const scope = new Scope({ element: elementSource, text: textSource, api: apiSource(global) });
    const match = config.match === undefined ? undefined : compileExpr(config.match, 'boolean', 'match', scope);
    const actions = compileBody(config.actions, 'value', 'actions', scope);
    finish(scope);
    return { ...(match && { match }), actions, names: scope.readerNames };
}

/**
 * Default runConditions — by default, detectors only trigger in the top frame.
 * Specifying custom runConditions in config replaces (not merges) these defaults.
 */
const DEFAULT_RUN_CONDITIONS = /** @type {import('../../config-feature.js').ConditionBlock[]} */ ([
    {
        context: { top: true },
    },
]);

/**
 * Validate that a name matches the required format.
 * Names must start with a letter and contain only alphanumeric characters and underscores.
 *
 * @param {string} name
 * @returns {boolean}
 */
function isValidName(name) {
    return NAME_PATTERN.test(name);
}

/**
 * Normalize a raw detector configuration by resolving all optional fields to concrete values.
 * After normalization, consumers never need fallback defaults.
 *
 * Default behavior (when fields are omitted from config):
 * - Detector is enabled
 * - breakageReport trigger is enabled, restricted to top frame
 * - auto trigger is disabled (opt-in only), restricted to top frame, no intervals
 *
 * A detector that fails to parse keeps the parse error, and does not run.
 *
 * @param {RawDetectorConfig} config
 * @param {object} global - the global object `api` reads from
 * @returns {DetectorConfig}
 */
function normalizeDetector(config, global) {
    /** @type {DetectorConfig['compiled']} */
    let compiled;
    try {
        compiled = compileDetector(config, global);
    } catch (e) {
        compiled = { error: e instanceof Error ? e.message : String(e) };
    }

    return {
        // Detectors are enabled by default
        state: config.state ?? 'enabled',
        compiled,
        triggers: {
            // breakageReport: enabled by default - detectors participate in breakage report flow
            breakageReport: {
                state: config.triggers?.breakageReport?.state ?? 'enabled',
                runConditions: /** @type {ConditionBlockOrArray} */ (
                    config.triggers?.breakageReport?.runConditions ?? DEFAULT_RUN_CONDITIONS
                ),
            },
            // auto: disabled by default - detectors must opt in to automatic execution
            auto: {
                state: config.triggers?.auto?.state ?? 'disabled',
                runConditions: /** @type {ConditionBlockOrArray} */ (config.triggers?.auto?.runConditions ?? DEFAULT_RUN_CONDITIONS),
                when: config.triggers?.auto?.when ?? { intervalMs: [] },
            },
        },
    };
}

/**
 * Parse detector configurations from raw config.
 *
 * @param {Record<string, Record<string, RawDetectorConfig>> | undefined} detectorsConfig
 * @param {object} [global] - the global object `api` reads from
 * @returns {Record<string, Record<string, DetectorConfig>>}
 */
export function parseDetectors(detectorsConfig, global = globalThis) {
    /** @type {Record<string, Record<string, DetectorConfig>>} */
    const detectors = {};

    if (!detectorsConfig) {
        return detectors;
    }

    for (const [groupName, groupConfig] of Object.entries(detectorsConfig)) {
        if (!isValidName(groupName)) {
            continue;
        }

        /** @type {Record<string, DetectorConfig>} */
        const groupDetectors = {};

        for (const [detectorId, detectorConfig] of Object.entries(groupConfig)) {
            if (!isValidName(detectorId)) {
                continue;
            }

            groupDetectors[detectorId] = normalizeDetector(detectorConfig, global);
        }

        detectors[groupName] = groupDetectors;
    }

    return detectors;
}
