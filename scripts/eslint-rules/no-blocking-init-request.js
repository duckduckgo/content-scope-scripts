/**
 * ESLint rule: a feature's `init()` must not block on a request to the client.
 *
 * `callInit()` awaits `init()`, and `content-scope-features.js` awaits every
 * feature's `callInit()` before it drains queued config updates. A `request()`
 * awaited inside `init()` therefore holds the feature (and the shared init
 * chain) open for a full round trip to native, and holds it open forever on a
 * platform where no handler responds.
 *
 * The common case is gating a feature on a native "is this enabled?" reply.
 * That belongs in remote config (`getFeatureSettingEnabled`) or in
 * `userPreferences`, both of which arrive with the injected args - no round
 * trip needed.
 */

/** Message methods that represent a round trip to the client. */
const DEFAULT_METHOD_NAMES = ['request'];

const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

/**
 * Walk `node`'s descendants without descending into nested functions, so we
 * only ever look at code that runs as part of `init()` itself. A request made
 * inside a callback (an event listener, a `setTimeout`) does not block init.
 *
 * @param {any} node
 * @param {(node: any) => void} visit
 */
function walkOwnScope(node, visit) {
    if (!node || typeof node.type !== 'string') return;
    visit(node);
    for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const value = node[key];
        if (Array.isArray(value)) {
            for (const child of value) {
                if (child && typeof child.type === 'string' && !FUNCTION_TYPES.has(child.type)) {
                    walkOwnScope(child, visit);
                }
            }
        } else if (value && typeof value.type === 'string' && !FUNCTION_TYPES.has(value.type)) {
            walkOwnScope(value, visit);
        }
    }
}

/**
 * True for `this.request(…)`, `this.messaging.request(…)`, `this.#messaging.request(…)`,
 * i.e. a call to one of `methodNames` on something reached from `this`.
 *
 * @param {any} node
 * @param {Set<string>} methodNames
 */
function isClientRequestCall(node, methodNames) {
    if (node.type !== 'CallExpression') return false;
    const callee = node.callee;
    if (!callee || callee.type !== 'MemberExpression') return false;
    const name = callee.property?.type === 'Identifier' ? callee.property.name : null;
    if (!name || !methodNames.has(name)) return false;
    // Unwrap `this.a.b.request` back to `this`
    let root = callee.object;
    while (root && root.type === 'MemberExpression') {
        root = root.object;
    }
    return root?.type === 'ThisExpression';
}

/**
 * The `init` methods of a class: `init() {}`, `async init() {}` and `init = async () => {}`.
 *
 * @param {any} node
 * @returns {any | null} the function node, if this is an `init` definition
 */
function initFunction(node) {
    if (node.computed || node.key?.type !== 'Identifier' || node.key.name !== 'init') return null;
    if (node.type === 'MethodDefinition') return node.value;
    if (node.type === 'PropertyDefinition' && FUNCTION_TYPES.has(node.value?.type)) return node.value;
    return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export const noBlockingInitRequest = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow blocking a feature’s init() on a request/response round trip to the client',
            url: 'https://github.com/duckduckgo/content-scope-scripts/blob/main/injected/docs/features-guide.md#red-flags-in-init',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    methodNames: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Method names that perform a round trip to the client',
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            blockingInit:
                'Do not block init() on `{{name}}()`. Awaiting a client round trip delays this feature and every other feature’s init, and hangs forever if no handler replies. Gate the feature with remote config (getFeatureSettingEnabled) or userPreferences, or move the request off the init path (send it without awaiting, or use subscribe()).',
        },
    },
    create(context) {
        const options = context.options[0] || {};
        const methodNames = new Set(options.methodNames?.length ? options.methodNames : DEFAULT_METHOD_NAMES);

        /**
         * Report any client request reached from an `await` or a `return` in
         * init's own scope - both make `callInit()` wait for the response.
         *
         * @param {any} fn
         */
        function checkInit(fn) {
            if (!fn.body) return;
            // Expression-bodied arrow: `init = async () => this.request(…)` returns the promise
            if (fn.body.type !== 'BlockStatement') {
                reportRequestsIn(fn.body);
                return;
            }
            walkOwnScope(fn.body, (node) => {
                const blocked = node.type === 'AwaitExpression' ? node.argument : node.type === 'ReturnStatement' ? node.argument : null;
                if (blocked) reportRequestsIn(blocked);
            });
        }

        /**
         * @param {any} expression an expression whose promise `init()` waits on
         */
        function reportRequestsIn(expression) {
            walkOwnScope(expression, (node) => {
                if (!isClientRequestCall(node, methodNames)) return;
                context.report({
                    node,
                    messageId: 'blockingInit',
                    data: { name: context.sourceCode.getText(node.callee) },
                });
            });
        }

        return {
            MethodDefinition(node) {
                const fn = initFunction(node);
                if (fn) checkInit(fn);
            },
            PropertyDefinition(node) {
                const fn = initFunction(node);
                if (fn) checkInit(fn);
            },
        };
    },
};
