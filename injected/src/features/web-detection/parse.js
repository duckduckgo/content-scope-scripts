// eslint-disable-next-line no-redeclare
import { hasOwnProperty, isArray, objectKeys } from '../../captured-globals.js';
import { ConfigParseError, FAILURE_KINDS, NAME_PATTERN, asArray, isPlainObject } from './core.js';
import { elementSource, textSource } from './matching.js';
import { compilePredicate } from './predicates.js';
import { apiSource, rejectUnknownKeys } from './sources.js';

/**
 * @typedef {import('../../utils.js').FeatureState} FeatureState
 * @typedef {import('../../config-feature.js').ConditionBlockOrArray} ConditionBlockOrArray
 * @typedef {import('./core.js').FailureKind} FailureKind
 * @typedef {import('./expressions.js').Node} Node
 * @typedef {import('./expressions.js').NodeBase} NodeBase
 * @typedef {import('./expressions.js').RefNode} RefNode
 * @typedef {import('./expressions.js').SourceNode} SourceNode
 * @typedef {import('./expressions.js').CountNode} CountNode
 * @typedef {import('./expressions.js').IfNode} IfNode
 * @typedef {import('./expressions.js').Branch} Branch
 * @typedef {import('./expressions.js').Position} Position
 * @typedef {import('./expressions.js').CompiledPayloadField} CompiledPayloadField
 * @typedef {import('./sources.js').Placement} Placement
 */

/**
 * @template Body
 * @typedef {import('./sources.js').Source<Body>} Source
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

const EXPRESSION_KEYS = new Set([
    'element',
    'text',
    'api',
    'count',
    'first',
    'last',
    'sum',
    'mul',
    'min',
    'max',
    'sub',
    'div',
    'if',
    'any',
    'all',
    'none',
    'ref',
]);
const MODIFIER_KEYS = new Set(['as', 'catch', 'is']);
/** Keys reserved for later extensions, rejected by this release. */
const RESERVED_LATER = new Set(['aggregate', 'stable', 'confirm', 'retain']);
const LEGACY_OPERATORS = ['any', 'all', 'none'];

/** @type {{ number: ReadonlySet<Position>, boolean: ReadonlySet<Position>, none: ReadonlySet<Position> }} */
const FILLS = {
    number: new Set(['number', 'value']),
    boolean: new Set(['boolean', 'value']),
    none: new Set(),
};

/**
 * The positions an operand of `sum`, `mul`, `min` and `max`, or of `any`, `all` and `none`, fills
 * is decided once refs are resolved: a list of values when the operand gives one.
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

    /**
     * @param {Record<string, Source<any>>} sources
     */
    constructor(sources) {
        this.sources = sources;
        /** @type {import('./predicates.js').PredicateHooks} */
        this.hooks = {
            names: this.readerNames,
            operand: (raw, path) => {
                const node = compileExpr(raw, 'number', path, this);
                this.operandSinks[this.operandSinks.length - 1]?.push(node);
                return node;
            },
        };
    }

    /**
     * Compile within a node, recording the operands predicates compile as its dependencies.
     *
     * @template T
     * @param {Node[]} sink
     * @param {() => T} fn
     * @returns {T}
     */
    collecting(sink, fn) {
        this.operandSinks.push(sink);
        try {
            return fn();
        } finally {
            this.operandSinks.pop();
        }
    }
}

/**
 * @param {Scope} scope
 * @param {Omit<NodeBase, 'branches'> & Record<string, unknown>} fields
 * @param {Node[]} deps
 * @returns {any}
 */
function makeNode(scope, fields, deps) {
    const node = /** @type {Node} */ ({ ...fields, branches: [...scope.branches] });
    scope.nodes.push(node);
    scope.deps.set(node, deps);
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
    if (typeof raw === 'number') {
        return makeNode(scope, { kind: 'literal', value: raw, path, position }, []);
    }
    if (typeof raw === 'boolean') {
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
    if (hasIs && position !== 'boolean') throw new ConfigParseError(path, '`is` gives a boolean, and goes in boolean position');
    // With `is`, the expression computes a value for the predicate
    const valuePosition = hasIs ? 'value' : position;

    /** @type {Node} */
    let node;
    if (expressionKeys.length === 0) {
        if (hasIs || position !== 'boolean') throw new ConfigParseError(path, 'no expression key');
        // An object ANDs its keys, so no keys holds
        node = makeNode(scope, { kind: 'literal', value: true, path, position }, []);
    } else if (expressionKeys.length > 1) {
        if (hasIs || (position !== 'boolean' && position !== 'value')) {
            throw new ConfigParseError(path, 'several expression keys are their AND, in boolean or value position and never beside `is`');
        }
        const operands = expressionKeys.map((key) => compileKey(key, raw[key], 'boolean', `${path}.${key}`, scope));
        node = makeNode(scope, { kind: 'and', operands, path, position }, operands);
    } else {
        const key = /** @type {string} */ (expressionKeys[0]);
        node = compileKey(key, raw[key], valuePosition, path, scope);
    }

    if (raw.as !== undefined) {
        if (typeof raw.as !== 'string' || !NAME_PATTERN.test(raw.as)) throw new ConfigParseError(`${path}.as`, 'invalid name');
        if (scope.names.has(raw.as)) throw new ConfigParseError(`${path}.as`, `duplicate name '${raw.as}'`);
        scope.names.set(raw.as, node);
        node.as = raw.as;
    }
    if (raw.catch !== undefined) {
        if (!isPlainObject(raw.catch)) throw new ConfigParseError(`${path}.catch`, '`catch` takes an object');
        /** @type {Partial<Record<FailureKind, Node>>} */
        const handlers = {};
        for (const kind of objectKeys(raw.catch)) {
            if (!FAILURE_KINDS.includes(/** @type {FailureKind} */ (kind))) {
                throw new ConfigParseError(`${path}.catch.${kind}`, `unknown failure kind '${kind}'`);
            }
            const handler = compileExpr(raw.catch[kind], node.position, `${path}.catch.${kind}`, scope);
            handlers[/** @type {FailureKind} */ (kind)] = handler;
            /** @type {Node[]} */ (scope.deps.get(node)).push(handler);
        }
        node.catch = handlers;
    }
    if (hasIs) {
        const sink = /** @type {Node[]} */ (scope.deps.get(node));
        node.is = scope.collecting(sink, () => compilePredicate(raw.is, 'value', `${path}.is`, scope.hooks));
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
        case 'count':
            expectPosition(position, FILLS.number, key, path);
            return compileUnary('count', body, 'items', position, path, scope);
        case 'first':
        case 'last':
            expectPosition(position, FILLS.number, key, path);
            return compileUnary(key, body, 'values', position, path, scope);
        case 'sum':
        case 'mul':
        case 'min':
        case 'max': {
            expectPosition(position, FILLS.number, key, path);
            const operands = asArray(body).map((raw, i) => {
                const operand = compileExpr(raw, 'number', `${path}[${i}]`, scope);
                scope.slots.push({ node: operand, single: 'number' });
                return operand;
            });
            return makeNode(scope, { kind: key, operands, path, position }, operands);
        }
        case 'sub':
        case 'div': {
            expectPosition(position, FILLS.number, key, path);
            if (!isArray(body) || body.length !== 2) throw new ConfigParseError(path, `'${key}' takes two operands`);
            const operands = body.map((raw, i) => compileExpr(raw, 'number', `${path}[${i}]`, scope));
            return makeNode(scope, { kind: key, operands, path, position }, operands);
        }
        case 'any':
        case 'all':
        case 'none':
            expectPosition(position, FILLS.boolean, key, path);
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
 * @param {Position} position
 * @param {ReadonlySet<Position>} fills
 * @param {string} key
 * @param {string} path
 */
function expectPosition(position, fills, key, path) {
    if (!fills.has(position)) {
        const hint = position === 'boolean' ? '; numbers become booleans only through `is`' : '';
        throw new ConfigParseError(path, `'${key}' does not fill ${position} position${hint}`);
    }
}

/**
 * @param {'count' | 'first' | 'last'} kind
 * @param {unknown} body
 * @param {Position} operandPosition
 * @param {Position} position
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node}
 */
function compileUnary(kind, body, operandPosition, position, path, scope) {
    const operand = compileExpr(body, operandPosition, `${path}.${kind}`, scope);
    return makeNode(scope, { kind, operand, path, position, bound: Infinity }, [operand]);
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
    if (position === 'items' || position === 'values') throw new ConfigParseError(path, `'if' does not fill ${position} position`);
    if (!isPlainObject(body)) throw new ConfigParseError(path, '`if` takes an object of test, then and else');
    rejectUnknownKeys(body, ['test', 'then', 'else'], `${path}.if`);
    for (const key of ['test', 'then', 'else']) {
        if (body[key] === undefined) throw new ConfigParseError(`${path}.if`, `'if' needs '${key}'`);
    }
    const test = compileExpr(body.test, 'boolean', `${path}.if.test`, scope);
    /** @type {IfNode} */
    const node = makeNode(scope, { kind: 'if', test, path, position }, [test]);
    for (const branch of /** @type {const} */ (['then', 'else'])) {
        scope.branches.push({ node, branch });
        try {
            node[branch] = compileExpr(body[branch], position, `${path}.if.${branch}`, scope);
        } finally {
            scope.branches.pop();
        }
        /** @type {Node[]} */ (scope.deps.get(node)).push(node[branch]);
    }
    return node;
}

/**
 * @param {unknown} body
 * @returns {boolean}
 */
function isLegacyBlock(body) {
    return isPlainObject(body) && LEGACY_OPERATORS.some((key) => hasOwnProperty.call(body, key));
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
    if (key !== 'api' && (isLegacyBlock(body) || (isArray(body) && body.some(isLegacyBlock)))) {
        if (position !== 'boolean') throw new ConfigParseError(bodyPath, '`any`, `all` and `none` inside a source take boolean position');
        return compileLegacy(source, body, bodyPath, scope);
    }
    if (key === 'api' && isArray(body)) throw new ConfigParseError(bodyPath, '`api` takes one body');
    /** @type {Node[]} */
    const deps = [];
    const bodies = scope.collecting(deps, () =>
        asArray(body).map((raw, i) => source.parse(raw, isArray(body) ? `${bodyPath}[${i}]` : bodyPath, scope.hooks)),
    );
    if (bodies.length === 0) throw new ConfigParseError(bodyPath, 'no bodies');
    return makeNode(scope, { kind: 'source', source, bodies, path, position }, deps);
}

/**
 * `{"text": {"all": [...]}}`, the form shipped before expressions: operator blocks over bodies, in
 * boolean position.
 *
 * @param {Source<any>} source
 * @param {unknown} body
 * @param {string} path
 * @param {Scope} scope
 * @returns {Node}
 */
function compileLegacy(source, body, path, scope) {
    if (isArray(body)) {
        const operands = body.map((entry, i) => compileLegacy(source, entry, `${path}[${i}]`, scope));
        return makeNode(scope, { kind: 'any', operands, path, position: 'boolean' }, operands);
    }
    if (!isLegacyBlock(body)) {
        /** @type {Node[]} */
        const deps = [];
        const bodies = scope.collecting(deps, () => [source.parse(body, path, scope.hooks)]);
        return makeNode(scope, { kind: 'source', source, bodies, path, position: 'boolean' }, deps);
    }
    const block = /** @type {Record<string, unknown>} */ (body);
    const keys = objectKeys(block);
    const leafKeys = keys.filter((key) => !LEGACY_OPERATORS.includes(key));
    if (leafKeys.length > 0) {
        throw new ConfigParseError(path, `condition node mixes operator keys with leaf fields [${leafKeys.join(', ')}]`);
    }
    const blocks = keys.map((key) => {
        const operands = asArray(block[key]).map((entry, i) => compileLegacy(source, entry, `${path}.${key}[${i}]`, scope));
        return makeNode(scope, { kind: key, operands, path: `${path}.${key}`, position: 'boolean' }, operands);
    });
    if (blocks.length === 1) return blocks[0];
    return makeNode(scope, { kind: 'and', operands: blocks, path, position: 'boolean' }, blocks);
}

/**
 * The positions an expression fills.
 *
 * @param {Node} node
 * @param {Set<Node>} [visiting] - guards against cycles, which `checkCycles` reports
 * @returns {ReadonlySet<Position>}
 */
function fillsOf(node, visiting = new Set()) {
    if (visiting.has(node)) return FILLS.none;
    visiting.add(node);
    switch (node.kind) {
        case 'literal':
            return typeof node.value === 'number' ? FILLS.number : FILLS.boolean;
        case 'source': {
            /** @type {Set<Position>} */
            const fills = new Set();
            const placements = node.bodies.map((body) => node.source.placements(body));
            for (const placement of /** @type {Placement[]} */ (['boolean', 'value', 'items', 'values'])) {
                if (!placements.every((set) => set.has(placement))) continue;
                fills.add(placement);
                if (placement === 'value') fills.add('number');
            }
            return fills;
        }
        case 'count':
        case 'first':
        case 'last':
        case 'sum':
        case 'mul':
        case 'min':
        case 'max':
        case 'sub':
        case 'div':
            return FILLS.number;
        case 'any':
        case 'all':
        case 'none':
        case 'and':
            return FILLS.boolean;
        case 'if': {
            const elseFills = fillsOf(node.else, visiting);
            return new Set([...fillsOf(node.then, visiting)].filter((p) => elseFills.has(p) && p !== 'items' && p !== 'values'));
        }
        case 'ref':
            return node.target ? fillsOf(node.target, visiting) : FILLS.none;
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
    for (const { node, single } of scope.slots) {
        const fills = fillsOf(node);
        // Under any / all / none, an operand that is a boolean stays one
        if (single === 'boolean' && fills.has('boolean')) node.position = 'boolean';
        else node.position = fills.has('values') ? 'values' : single;
    }
    for (const node of scope.nodes) {
        if (!fillsOf(node).has(node.position)) {
            const what =
                node.kind === 'source'
                    ? `'${/** @type {SourceNode} */ (node).source.key}'${node.bodies.some((b) => /** @type {any} */ (b).field) ? ' with field' : ''}`
                    : `'${node.kind}'`;
            throw new ConfigParseError(node.path, `${what} does not fill ${node.position} position`);
        }
    }
    for (const node of scope.nodes) {
        if (node.kind === 'count') node.bound = countBound(node, scope);
    }
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
 * The count from which every predicate testing a count gives the result the full count would. The
 * predicates testing a count are its `is`, the `is` of each ref to it, and each payload field
 * reading it directly. Any other use reads the full count.
 *
 * @param {CountNode} count
 * @param {Scope} scope
 * @returns {number}
 */
function countBound(count, scope) {
    /** @type {Node[]} */
    const uses = [count, ...scope.refs.map(({ ref }) => ref).filter((ref) => ref.target === count)];
    let bound = 0;
    for (const use of uses) {
        if (use.is) {
            bound = Math.max(bound, use.is.bound);
            continue;
        }
        const field = scope.payloadRoots.get(use);
        if (!field || (!field.when && !field.buckets)) return Infinity;
        if (field.when) bound = Math.max(bound, field.when.bound);
        for (const [, bucket] of field.buckets ?? []) bound = Math.max(bound, bucket.bound);
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
        scope.collecting(deps, () => {
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
