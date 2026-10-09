import { isArray, objectKeys } from '../../captured-globals.js';
import {
    ConfigParseError,
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
 * @typedef {import('./expressions.js').RefNode} RefNode
 * @typedef {import('./expressions.js').SourceNode} SourceNode
 * @typedef {import('./expressions.js').LengthNode} LengthNode
 * @typedef {import('./expressions.js').ExprNode} ExprNode
 * @typedef {import('./expressions.js').IfNode} IfNode
 * @typedef {import('./expressions.js').Branch} Branch
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
 * Raw detector config. `match` and the payloads are read as `unknown` and validated by the compiler,
 * since the pinned privacy-configuration schema predates expressions.
 *
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection').DetectorConfig} RawDetectorConfig
 */

/**
 * Condition used to determine if a detector has matched.
 *
 * @typedef {RawDetectorConfig['match']} MatchCondition
 */

/**
 * Final-condition shape of the form shipped before expressions.
 *
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.ts').MatchConditionSingle} MatchConditionSingle
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
 * @typedef {object} FireEventAction
 * @property {FeatureState} state - whether this action is enabled
 * @property {string} type
 */

/**
 * Actions to take when a detector matches.
 * breakageReportData is always present (defaults to enabled).
 * fireEvent is opt-in by presence; when present, sub-fields are fully resolved.
 *
 * @typedef {object} ActionState
 * @property {FeatureState} state - whether the action is enabled
 */

/**
 * @typedef {object} DetectorActions
 * @property {ActionState} breakageReportData - Whether to include in breakage report data
 * @property {FireEventAction} [fireEvent] - fire a detection event to the client via webEvents
 */

/**
 * Normalized detector configuration.
 *
 * Every optional field from the raw config is resolved to a concrete value.
 * Consumers never need fallback defaults.
 *
 * @typedef {object} DetectorConfig
 * @property {FeatureState} state - Whether the detector is enabled
 * @property {MatchCondition} match - Conditions for the detector to match, as configured
 * @property {CompiledDetector | { error: string }} compiled - `match` and the payloads compiled, or why they failed to parse
 * @property {Triggers} triggers - Trigger configurations
 * @property {DetectorActions} actions - Actions to take on match
 */

/**
 * Compiled `match` and payloads of one detector.
 *
 * @typedef {object} CompiledDetector
 * @property {Node} match
 * @property {CompiledPayloadField[]} [fireEventData]
 * @property {CompiledPayloadField[]} [breakageReportData]
 * @property {Set<string>} names - every name config reads or calls, for the native reader
 */

const MODIFIER_KEYS = new Set(['using', 'as', 'is']);
/** Keys reserved for later extensions, rejected by this release. */
const RESERVED_LATER = new Set(['aggregate', 'stable', 'confirm', 'retain']);

/**
 * What `self` reads from: the expression beside a `using`, or each value a `where` or `field` tests
 * or reads from.
 *
 * @typedef {{ using: Node } | { item: ItemBinder }} Binding
 */

/**
 * The position of an operand of `sum` and `mul`, or of `any`, `all` and `none`, is
 * decided once refs are resolved: `spread` when the operand can give a list.
 *
 * @typedef {{ node: Node, single: 'number' | 'boolean' }} Slot
 */

class Scope {
    /** @type {Map<string, Node>} */
    names = new Map();
    /** @type {Array<{ ref: RefNode, inMatch: boolean }>} */
    refs = [];
    /** @type {Node[]} */
    nodes = [];
    /** @type {Slot[]} */
    slots = [];
    /** @type {Map<Node, Node[]>} edges for the cycle check */
    deps = new Map();
    /** @type {Map<Node, CompiledPayloadField>} the expression each payload field's value is */
    payloadRoots = new Map();
    /** @type {Branch[]} the `if` branches enclosing the expression being compiled */
    branches = [];
    /** @type {Node[][]} where operands compiled inside predicates are recorded as dependencies */
    operandSinks = [];
    inMatch = true;
    /** @type {Set<string>} */
    readerNames = new Set();
    /** @type {Binding[]} the bindings of `self` enclosing the expression being compiled, innermost last */
    bindings = [];

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
                return within(this.bindings, { item: binder }, () => fn(binder));
            },
        };
    }

    /** The innermost `where` or `field` enclosing the expression being compiled. */
    get itemBinder() {
        for (let i = this.bindings.length - 1; i >= 0; i--) {
            const binding = /** @type {Binding} */ (this.bindings[i]);
            if ('item' in binding) return binding.item;
        }
        return undefined;
    }
}

/**
 * Run `fn` with `entry` innermost on `stack`: a binding of `self`, the `if` branch being compiled, or
 * the node recording the operands predicates compile as its dependencies.
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
 * @param {Omit<NodeBase, 'branches'> & Record<string, unknown>} fields
 * @param {Node[]} deps
 * @returns {any}
 */
function makeNode(scope, fields, deps) {
    const binder = scope.itemBinder;
    const node = /** @type {Node} */ ({ ...(binder && { binder }), ...fields, branches: [...scope.branches] });
    scope.nodes.push(node);
    // Copied: operands a predicate compiles are added to the deps later, and are not operands
    scope.deps.set(node, [...deps]);
    return node;
}

/**
 * Compile an expression in a position.
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
        // An array is the OR of its entries, a boolean
        if (position !== 'boolean' && position !== 'value') throw new ConfigParseError(path, `an array does not fill ${position} position`);
        return compileLogic('any', raw, position, path, scope);
    }
    if (!isPlainObject(raw)) throw new ConfigParseError(path, 'expected an expression');

    const keys = objectKeys(raw);
    /** @type {string[]} */
    const expressionKeys = [];
    for (const key of keys) {
        if (EXPRESSION_KEYS.has(key)) expressionKeys.push(key);
        else if (RESERVED_LATER.has(key)) throw new ConfigParseError(`${path}.${key}`, `'${key}' is reserved`);
        else if (!MODIFIER_KEYS.has(key)) throw new ConfigParseError(`${path}.${key}`, `unknown expression key '${key}'`);
    }

    const hasIs = raw.is !== undefined;
    const hasUsing = raw.using !== undefined;
    if (hasIs && position !== 'boolean') throw new ConfigParseError(path, '`is` gives a boolean, and goes in boolean position');
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
        node = compileKey(key, raw[key], keyPosition, path, scope);
    }
    if (hasUsing) node = compileUsing(raw.using, node, valuePosition, path, scope);

    if (raw.as !== undefined) {
        if (typeof raw.as !== 'string' || !NAME_PATTERN.test(raw.as)) throw new ConfigParseError(`${path}.as`, 'invalid name');
        if (scope.names.has(raw.as)) throw new ConfigParseError(`${path}.as`, `duplicate name '${raw.as}'`);
        scope.names.set(raw.as, node);
        node.as = raw.as;
    }
    if (hasIs) {
        const sink = /** @type {Node[]} */ (scope.deps.get(node));
        node.is = within(scope.operandSinks, sink, () => compilePredicate(raw.is, 'value', `${path}.is`, scope.hooks));
    }
    return node;
}

/**
 * @param {string} key
 * @param {unknown} body
 * @param {Position} position
 * @param {string} path
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
            // An operand with `is` gives a boolean, in boolean position
            const operandIs = isPlainObject(body) && body.is !== undefined;
            const operand = compileExpr(body, operandIs ? 'boolean' : position, `${path}.expr`, scope);
            return makeNode(scope, { kind: 'expr', operand, path, position }, [operand]);
        }
        case 'only': {
            const operand = compileExpr(body, 'list', `${path}.only`, scope);
            return makeNode(scope, { kind: 'only', operand, path, position }, [operand]);
        }
        case 'sum':
        case 'mul': {
            const operands = asArray(body).map((raw, i) => {
                const operand = compileExpr(raw, 'number', `${path}[${i}]`, scope);
                scope.slots.push({ node: operand, single: 'number' });
                return operand;
            });
            return makeNode(scope, { kind: key, operands, path, position }, operands);
        }
        case 'div': {
            if (!isArray(body) || body.length !== 2) throw new ConfigParseError(path, `'div' takes two operands`);
            const operands = body.map((raw, i) => compileExpr(raw, 'number', `${path}[${i}]`, scope));
            return makeNode(scope, { kind: key, operands, path, position }, operands);
        }
        case 'any':
        case 'all':
        case 'none':
            return compileLogic(key, asArray(body), position, path, scope);
        case 'if':
            return compileIf(body, position, path, scope);
        case 'ref': {
            if (typeof body !== 'string') throw new ConfigParseError(path, '`ref` takes a name');
            /** @type {RefNode} */
            const ref = makeNode(scope, { kind: 'ref', name: body, path, position }, []);
            scope.refs.push({ ref, inMatch: scope.inMatch });
            return ref;
        }
        default:
            throw new ConfigParseError(path, `unknown expression key '${key}'`);
    }
}

/**
 * `using`: an expression over the value of the expression beside it, which `self` reads. A path or an
 * `api` body is short for a `self` with that body.
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
    if (!isExpressionObject(raw)) return within(scope.bindings, { using: root }, () => compileSelf(raw, position, path, scope, 'using'));
    // An operand with `is` gives a boolean, in boolean position
    const operandIs = raw.is !== undefined;
    const operand = within(scope.bindings, { using: root }, () => compileExpr(raw, operandIs ? 'boolean' : position, usingPath, scope));
    // Its own node, so the `as` and `is` beside `using` are not the operand's
    return makeNode(scope, { kind: 'expr', operand, path, position }, [operand, root]);
}

/**
 * `self`: a read from the value the innermost `using`, `where` or `field` binds, as an `api` reads from
 * the global object. `{}` is the value itself, and `length` alone a `length` node, which reads only as
 * many items of a list as the predicates testing it need.
 *
 * @param {unknown} raw
 * @param {Position} position
 * @param {string} path
 * @param {Scope} scope
 * @param {string} [key] - the key the body sits under, for messages
 * @returns {Node}
 */
function compileSelf(raw, position, path, scope, key = 'self') {
    const bodyPath = `${path}.${key}`;
    const binding = scope.bindings[scope.bindings.length - 1];
    if (!binding) throw new ConfigParseError(bodyPath, '`self` reads from `using`, `where` or `field`, and none encloses it');
    const root = 'using' in binding ? binding.using : itemNode(binding.item, scope);
    if (isPlainObject(raw) && objectKeys(raw).length === 0) {
        return makeNode(scope, { kind: 'expr', operand: root, path, position }, [root]);
    }
    if (raw === 'length' || (isPlainObject(raw) && raw.path === 'length' && objectKeys(raw).length === 1)) {
        scope.readerNames.add('length');
        return makeNode(scope, { kind: 'length', operand: root, path, position, bound: Infinity }, [root]);
    }
    const source = /** @type {Source<ApiBody>} */ (scope.sources.api);
    /** @type {Node[]} */
    const deps = [root];
    const parsed = within(scope.operandSinks, deps, () => parseApiBody(raw, bodyPath, scope.hooks, key === 'using' ? 'using' : 'self'));
    parsed.root = root;
    return makeNode(scope, { kind: 'source', source, bodies: [parsed], path, position }, deps);
}

/**
 * The node giving the value a `where` or `field` binds, one per binder.
 *
 * @param {ItemBinder} binder
 * @param {Scope} scope
 * @returns {ItemNode}
 */
function itemNode(binder, scope) {
    if (!binder.node) {
        /** @type {ItemNode} */
        const node = makeNode(scope, { kind: 'item', binder, path: '', position: 'value' }, []);
        node.perItem = true;
        binder.node = node;
    }
    return binder.node;
}

/**
 * @param {'any' | 'all' | 'none'} kind
 * @param {unknown[]} raws
 * @param {Position} position
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node}
 */
function compileLogic(kind, raws, position, path, scope) {
    const operands = raws.map((raw, i) => {
        const operand = compileExpr(raw, 'boolean', `${path}[${i}]`, scope);
        if (!operand.is) scope.slots.push({ node: operand, single: 'boolean' });
        return operand;
    });
    return makeNode(scope, { kind, operands, path, position }, operands);
}

/**
 * @param {unknown} body
 * @param {Position} position
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node}
 */
function compileIf(body, position, path, scope) {
    if (position === 'list') throw new ConfigParseError(path, `'if' does not fill list position`);
    if (!isPlainObject(body)) throw new ConfigParseError(path, '`if` takes an object of test, then and else');
    rejectUnknownKeys(body, ['test', 'then', 'else'], `${path}.if`);
    for (const key of ['test', 'then', 'else']) {
        if (body[key] === undefined) throw new ConfigParseError(`${path}.if`, `'if' needs '${key}'`);
    }
    const test = compileExpr(body.test, 'boolean', `${path}.if.test`, scope);
    /** @type {IfNode} */
    const node = makeNode(scope, { kind: 'if', test, path, position }, [test]);
    for (const branch of /** @type {const} */ (['then', 'else'])) {
        node[branch] = within(scope.branches, { node, branch }, () => compileExpr(body[branch], position, `${path}.if.${branch}`, scope));
        /** @type {Node[]} */ (scope.deps.get(node)).push(node[branch]);
    }
    return node;
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
    const bodyPath = `${path}.${key}`;
    if (key === 'api' && isArray(body)) throw new ConfigParseError(bodyPath, '`api` takes one body');
    /** @type {Node[]} */
    const deps = [];
    const bodies = within(scope.operandSinks, deps, () =>
        asArray(body).map((raw, i) => source.parse(raw, isArray(body) ? `${bodyPath}[${i}]` : bodyPath, scope.hooks)),
    );
    if (bodies.length === 0) throw new ConfigParseError(bodyPath, 'no bodies');
    return makeNode(scope, { kind: 'source', source, bodies, path, position }, deps);
}

/**
 * The positions an expression fills, once refs are resolved and `checkCycles` has passed.
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
            const elseFills = fillsOf(node.else);
            return new Set([...fillsOf(node.then)].filter((p) => elseFills.has(p) && p !== 'list'));
        }
        case 'ref':
            return fillsOf(/** @type {Node} */ (node.target));
        case 'expr':
            return node.operand.is ? FILLS.boolean : fillsOf(node.operand);
        case 'item':
            // A bound value may be any value, and is checked where it is read
            return FILLS.any;
    }
}

/**
 * Mark the expressions computed per item: those reading `self` of the `where` or `field` they sit in.
 * One per run inside a `where` stays per run. A per-item expression, or one inside a per-item `if`,
 * takes no `as`, so no `ref` reads one.
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
    for (const node of scope.nodes) {
        if (node.as === undefined) continue;
        if (node.perItem || node.branches.some((branch) => branch.node.perItem)) {
            throw new ConfigParseError(node.path, `'${node.as}' names one value per run, and this reads \`self\` per item`);
        }
    }
}

/**
 * @param {Scope} scope
 */
function resolve(scope) {
    for (const { ref, inMatch } of scope.refs) {
        const target = scope.names.get(ref.name);
        if (!target) throw new ConfigParseError(ref.path, `unresolved ref '${ref.name}'`);
        ref.target = target;
        /** @type {Node[]} */ (scope.deps.get(ref)).push(target);
        if (inMatch && !target.branches.every((branch) => ref.branches.includes(branch))) {
            throw new ConfigParseError(ref.path, `ref '${ref.name}' reads into an 'if' branch from outside it`);
        }
    }
    checkCycles(scope);
    markPerItem(scope);
    for (const { node, single } of scope.slots) {
        // `element` without `field` and `text` are the condition leaf under any / all / none: a boolean
        const leaf = single === 'boolean' && isPresenceLeaf(node);
        node.position = fillsOf(node).has('list') && !leaf ? 'spread' : single;
    }
    for (const node of scope.nodes) {
        if (!fits(fillsOf(node), node.position)) {
            const what =
                node.kind === 'source'
                    ? `'${/** @type {SourceNode} */ (node).source.key}'${node.bodies.some((b) => /** @type {any} */ (b).field) ? ' with field' : ''}`
                    : `'${node.kind}'`;
            const hint = node.position === 'boolean' && fillsOf(node).has('number') ? '; numbers become booleans only through `is`' : '';
            throw new ConfigParseError(node.path, `${what} does not fill ${node.position} position${hint}`);
        }
    }
    for (const node of scope.nodes) {
        if (node.kind === 'length') node.bound = lengthBound(node, scope);
    }
}

/**
 * Whether an expression is the condition leaf: `element` without `field`, or `text`, directly or
 * through refs and `expr`.
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isPresenceLeaf(node) {
    let current = node;
    while (current.kind === 'ref' || (current.kind === 'expr' && !current.operand.is)) {
        current = current.kind === 'ref' ? /** @type {Node} */ (current.target) : current.operand;
    }
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
 * @param {Scope} scope
 */
function checkCycles(scope) {
    /** @type {Map<Node, 'visiting' | 'done'>} */
    const state = new Map();
    /**
     * @param {Node} node
     */
    const visit = (node) => {
        const seen = state.get(node);
        if (seen === 'done') return;
        if (seen === 'visiting') throw new ConfigParseError(node.path, 'refs form a cycle');
        state.set(node, 'visiting');
        for (const dep of scope.deps.get(node) ?? []) visit(dep);
        state.set(node, 'done');
    };
    scope.nodes.forEach(visit);
}

/**
 * The length from which every predicate testing a `length` gives the result the full length would.
 * Its uses are the `length` itself, each ref to a use, and each `expr` over a use without `is`. The
 * predicates testing it are each use's `is`, and the `when` and buckets of each bucketed payload field
 * reading a use directly. Any other use reads the full length, an unbucketed payload field included,
 * since it sends the value.
 *
 * @param {LengthNode} length
 * @param {Scope} scope
 * @returns {number}
 */
function lengthBound(length, scope) {
    /** @type {Set<Node>} */
    const uses = new Set([length]);
    /** @type {Set<Node>} operands an `expr` passes through, judged at the `expr` */
    const passed = new Set();
    // A set iterates the uses added while it runs
    for (const use of uses) {
        for (const node of scope.nodes) {
            if (node.kind === 'ref' && node.target === use) uses.add(node);
            if (node.kind === 'expr' && node.operand === use && !use.is) {
                uses.add(node);
                passed.add(use);
            }
        }
    }
    let bound = 0;
    for (const use of uses) {
        if (use.is) {
            bound = Math.max(bound, use.is.bound);
            continue;
        }
        if (passed.has(use)) continue;
        const field = scope.payloadRoots.get(use);
        if (!field?.buckets) return Infinity;
        if (field.when) bound = Math.max(bound, field.when.bound);
        for (const [, bucket] of field.buckets) bound = Math.max(bound, bucket.bound);
    }
    return bound;
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
        const field = { key, value };
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
        scope.payloadRoots.set(value, field);
        return field;
    });
}

/**
 * Compile a detector's `match` and payloads.
 *
 * @param {RawDetectorConfig} config
 * @param {object} global - the global object `api` reads from
 * @returns {CompiledDetector} throws a `ConfigParseError`
 */
export function compileDetector(config, global) {
    const scope = new Scope({ element: elementSource, text: textSource, api: apiSource(global) });
    const match = compileExpr(config.match ?? {}, 'boolean', 'match', scope);
    scope.inMatch = false;
    const actions = /** @type {Record<string, { data?: unknown } | undefined>} */ (config.actions ?? {});
    /** @type {CompiledDetector} */
    const compiled = { match, names: scope.readerNames };
    if (actions.fireEvent?.data !== undefined) {
        compiled.fireEventData = compilePayload(actions.fireEvent.data, 'actions.fireEvent.data', scope);
    }
    if (actions.breakageReportData?.data !== undefined) {
        compiled.breakageReportData = compilePayload(actions.breakageReportData.data, 'actions.breakageReportData.data', scope);
    }
    resolve(scope);
    return compiled;
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
 * - breakageReportData action is enabled (results included in breakage reports)
 * - other actions are enabled by default if present, but can be explicitly disabled. If omitted they are not enabled
 *
 * A detector whose `match` or payloads fail to parse keeps the parse error, and returns `'error'` on
 * every run.
 *
 * @param {RawDetectorConfig} config
 * @param {object} global - the global object `api` reads from
 * @returns {DetectorConfig}
 */
function normalizeDetector(config, global) {
    const fireEvent = config.actions?.fireEvent;

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
        match: config.match,
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
        actions: {
            // breakageReportData: enabled by default - detection results included in breakage reports
            breakageReportData: { state: config.actions?.breakageReportData?.state ?? 'enabled' },
            // fireEvent: only present when configured - opt-in action that sends events to the client via webEvents
            ...(fireEvent && {
                fireEvent: {
                    state: fireEvent.state ?? 'enabled',
                    type: fireEvent.type,
                },
            }),
        },
    };
}

/**
 * Parse detector configurations from raw config.
 *
 * @param {import('@duckduckgo/privacy-configuration/schema/features/web-detection').WebDetectionSettings['detectors']} detectorsConfig
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
