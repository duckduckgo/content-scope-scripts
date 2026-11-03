/**
 * What a unit points at in the page: a whole element, a run of sibling nodes beside blocks, or one attribute.
 * @typedef {{ kind: 'element', element: Element }
 *          | { kind: 'run', parent: Element, nodes: ChildNode[] }
 *          | { kind: 'attribute', element: Element, attribute: string }} UnitTarget
 */

/**
 * What was sent for a unit. `elements[N]` is the live element behind `data-t="N"`.
 * @typedef {{ text: string, html: boolean, wrapped: boolean, elements: Element[] }} Serialized
 */

/**
 * Engine output as a tree: text, or an element we sent (by id) with its children.
 * @typedef {{ text: string } | { id: number, children: ParsedNode[] }} ParsedNode
 */

export {};
