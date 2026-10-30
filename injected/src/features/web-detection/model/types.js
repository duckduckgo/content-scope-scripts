/**
 * Shapes the stages share: the compiled tree `compile/` builds and `evaluate/` walks, and the
 * interfaces predicates and sources call back through, so they import neither the compiler nor the
 * evaluator.
 */

/**
 * @import { Failure } from './core.js'
 * @import { CompiledPredicate } from '../predicates/predicates.js'
 * @import { ApiBody } from '../sources/api.js'
 * @import { ElementBody } from '../sources/element.js'
 * @import { TextBody } from '../sources/text.js'
 */

/**
 * A body of `element`, `text` or `api`, as its source parsed it.
 *
 * @typedef {ApiBody | ElementBody | TextBody} SourceBody
 */

/**
 * What an expression's position expects. `spread` is an operand of `sum`, `mul`, `any`, `all` and
 * `none` that may be a list, contributing each item. `root` is a node or a list of nodes.
 *
 * @typedef {'boolean' | 'value' | 'number' | 'list' | 'spread' | 'root'} Position
 */

/**
 * @typedef {object} NodeBase
 * @property {string} path - the config path of the key the expression compiles from, which a failure or error arising at it takes
 * @property {Position} position - the position this occurrence fills. With `is`, the value position the predicate tests
 * @property {CompiledPredicate} [is]
 * @property {'number' | 'boolean'} [single] - for an operand of `sum`, `mul`, `any`, `all` or `none`, what it gives when it is not a list
 */

/**
 * A `using`, `where` or `field`, which binds `self` to each value it reads from or tests. `readsSelf`
 * is set when an expression inside reads `self`; without it, binding it binds nothing.
 *
 * @typedef {{ readsSelf?: true }} ItemBinder
 */

/**
 * @typedef {NodeBase & { kind: 'literal', value: number | boolean | string | null }} LiteralNode
 * @typedef {NodeBase & { kind: 'source', source: Source<any>, bodies: SourceBody[], withField: boolean, leaf: boolean }} SourceNode - `source` reads only the bodies it parsed, a pairing a union of sources can't express, hence `any`. `withField`: some body has `field`. `leaf`: `text`, or `element` without `field`, the condition leaf
 * @typedef {NodeBase & { kind: 'length', operand: Node }} LengthNode
 * @typedef {NodeBase & { kind: 'expr', operand: Node }} ExprNode
 * @typedef {NodeBase & { kind: 'using', root: Node, operand: Node, binds: ItemBinder }} UsingNode - `operand` reads `root`'s value through `self`
 * @typedef {NodeBase & { kind: 'list', entries: Node[] }} ListNode - `{"expr": [...]}`, each entry in value position
 * @typedef {NodeBase & { kind: 'only', operand: Node }} OnlyNode
 * @typedef {NodeBase & { kind: 'sum' | 'mul' | 'div', operands: Node[] }} ArithmeticNode
 * @typedef {NodeBase & { kind: 'any' | 'all' | 'none', operands: Node[] }} LogicNode
 * @typedef {NodeBase & { kind: 'if', test: Node, then: Node, else?: Node }} IfNode
 * @typedef {NodeBase & { kind: 'sequence', elements: Node[] }} SequenceNode - its elements in order, giving the last one's value
 * @typedef {NodeBase & { kind: 'ref', name: string }} RefNode
 * @typedef {NodeBase & { kind: 'item', binder: ItemBinder }} ItemNode - the value `self` is bound to in a `using`, `where` or `field`
 * @typedef {NodeBase & { kind: 'define', name: string, value: Node }} DefineNode
 * @typedef {NodeBase & { kind: 'fireEvent', type: string, data?: CompiledPayloadField[] }} FireEventNode
 * @typedef {NodeBase & { kind: 'breakageReportData', data?: CompiledPayloadField[] }} BreakageReportDataNode
 * @typedef {DefineNode | FireEventNode | BreakageReportDataNode} ActionNode
 * @typedef {LiteralNode | SourceNode | LengthNode | ExprNode | UsingNode | ListNode | OnlyNode | ArithmeticNode | LogicNode | IfNode | SequenceNode | RefNode | ItemNode | ActionNode} Node
 */

/**
 * A compiled expression as predicates and sources hold it: what `PredicateHooks.expression` gives,
 * passed back to the `PredicateContext` to evaluate. Named apart from `Node` since sources read DOM nodes.
 *
 * @typedef {Node} CompiledExpression
 */

/**
 * @typedef {object} CompiledPayloadField
 * @property {string} key
 * @property {string} path - the config path of the field, `<action>.data.<key>`
 * @property {Node} value
 * @property {CompiledPredicate} [when]
 * @property {CompiledBucket[]} [buckets] - tested in order, the first that holds naming the value
 */

/**
 * @typedef {object} CompiledBucket
 * @property {string} name
 * @property {CompiledPredicate} is
 * @property {string} path - the config path of `is`, `<field>.buckets.<index>.is`
 */

/**
 * What an action did in a run: it sent or wrote or bound, or a value it computes failed or errored.
 *
 * @typedef {'ran' | 'aborted' | 'error'} ActionOutcome
 */

/**
 * Each key's value as JSON parses it.
 *
 * @typedef {Record<string, unknown>} PayloadData
 */

/**
 * Where a detector's actions send what they do, as each runs. The feature implements it.
 *
 * @typedef {object} ActionSink
 * @property {(type: string, data?: PayloadData) => void} fireEvent - sends an event
 * @property {(data: PayloadData) => void} breakageReportData - writes to the detector's breakage entry
 */

/**
 * A source reads the page. `element` and `text` give a list, and `api` the value it reads: a list
 * with `where`, or with `field` on a list.
 *
 * @template Body
 * @typedef {object} Source
 * @property {string} key - the expression key in config
 * @property {(raw: unknown, path: string, hooks: PredicateHooks, key?: string) => Body} parse - throws a `ConfigParseError`. `key` names the expression key in messages, where the source parses a `self` or `using` body
 * @property {(body: Body) => ReadonlySet<Position>} fills - the positions config shows the source fills
 * @property {(bodies: Body[], ctx: PredicateContext) => unknown} read - the value: an `ItemBuffer` for a list, or a `Failure` for the source as a whole
 */

/**
 * What a predicate needs from the evaluation it runs in.
 *
 * @typedef {object} PredicateContext
 * @property {Reader} reader
 * @property {(operand: CompiledExpression) => unknown} operand - evaluates a compiled operand expression, giving its value or a `Failure`
 * @property {(expression: CompiledExpression) => unknown} read - evaluates a compiled expression in the position it was compiled for, giving its value or a `Failure`
 * @property {(expression: CompiledExpression) => unknown} arg - evaluates a compiled `args` expression, giving a selected list as an array, or a `Failure`
 * @property {(expression: CompiledExpression) => boolean | Failure} test - evaluates a compiled boolean expression with its `is`, giving the boolean or a `Failure`
 * @property {(value: unknown) => unknown[] | Failure | undefined} items - the items of a list value, or `undefined` for any other value
 * @property {<T>(binder: ItemBinder, value: unknown, fn: () => T) => T} bind - runs `fn` with `self` of a `where` or `field` bound to `value`
 * @property {TaskReads} task - the page reads shared by the detectors of the task this run is part of
 */

/**
 * Page reads shared by every detector run in one task. `evaluate/task-read-cache.js` implements it.
 *
 * @typedef {object} TaskReads
 * @property {<T>(node: object, key: string, compute: () => T) => T} of - the value `compute` gives for a node and key, computed once in the task
 */

/**
 * @typedef {object} PredicateHooks
 * @property {(raw: unknown, path: string, position: Position) => CompiledExpression} expression - compiles an expression in a position: a source's `root`, an `args` entry, an operand of `eq` or a comparison, a `field` expression, or an expression in `where`
 * @property {<T>(fn: (binder: ItemBinder) => T) => T} item - compiles a `where` or `field` that binds `self`
 * @property {Set<string>} names - collects every name read, for the native reader
 * @property {Set<string>} paths - collects every path read from the global object, up to the method it calls, for the native reader
 */

/**
 * Reads properties and calls methods on page values. `evaluate/native-reader.js` implements it.
 *
 * @typedef {object} Reader
 * @property {() => void} beginRun - start a run
 * @property {(target: unknown, name: string) => unknown} read - one property, or a `Failure`
 * @property {(target: unknown, name: string, args: readonly unknown[]) => unknown} call - a method's result, or a `Failure`
 * @property {(target: unknown) => boolean | Failure} isNode - whether a value is a DOM node, or a `Failure`
 * @property {(target: unknown) => Function | undefined | Failure} iteratorMethod - the iterator method of a value, when it has one, or a `Failure`
 */

export {};
