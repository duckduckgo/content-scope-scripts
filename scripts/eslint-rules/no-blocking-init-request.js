/**
 * ESLint rule: a feature's `load()` and `init()` must not block on a request to
 * the client. Both phases break, in different ways:
 *
 * `init()` - `callInit()` awaits `init()`, and `content-scope-features.js`
 * awaits every feature's `callInit()` before it drains queued config updates. A
 * `request()` awaited inside `init()` therefore holds the feature (and the
 * shared init chain) open for a full round trip to native, and holds it open
 * forever on a platform where no handler responds.
 *
 * `load()` - `callLoad()` does not await `load()`, so an `await` doesn't stall
 * the load loop; it silently splits the method in half. Everything after the
 * `await` runs in a later task, by which point the page may already have used
 * the API the feature meant to wrap - which is the whole reason `load()` exists.
 * `load()` also runs before the feature is known to be enabled for the site, so
 * a request there messages the client on pages the feature never runs on.
 *
 * The common case in both is gating a feature on a native "is this enabled?"
 * reply. That belongs in remote config (`getFeatureSettingEnabled`) or in
 * `userPreferences`, both of which arrive with the injected args - no round
 * trip needed.
 */

/** Message methods that represent a round trip to the client. */
const DEFAULT_METHOD_NAMES = ['request'];

/** Lifecycle methods that must not wait on the client, and the messageId for each. */
const LIFECYCLE_METHODS = {
    init: 'blockingInit',
    load: 'blockingLoad',
};

const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

/**
 * Walk `node`'s descendants without descending into nested functions, so we
 * only ever look at code that runs as part of the lifecycle method itself. A
 * request made inside a callback (an event listener, a `setTimeout`) doesn't
 * hold the phase up.
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
 * The lifecycle methods of a class, in any of the forms they're written in:
 * `init() {}`, `async init() {}`, `init = async () => {}`.
 *
 * @param {any} node
 * @returns {{fn: any, messageId: string} | null} the function node and the messageId to report against
 */
function lifecycleFunction(node) {
    const name = !node.computed && node.key?.type === 'Identifier' ? node.key.name : null;
    const messageId = name ? LIFECYCLE_METHODS[name] : null;
    if (!messageId) return null;
    if (node.type === 'MethodDefinition') return { fn: node.value, messageId };
    if (node.type === 'PropertyDefinition' && FUNCTION_TYPES.has(node.value?.type)) return { fn: node.value, messageId };
    return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export const noBlockingInitRequest = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow blocking a feature’s load() or init() on a request/response round trip to the client',
            url: 'https://github.com/duckduckgo/content-scope-scripts/blob/main/injected/docs/features-guide.md#features-lifecycle',
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
            blockingLoad:
                'Do not wait on `{{name}}()` in load(). callLoad() does not await load(), so everything after the await runs in a later task - by then the page may already have used the API this feature wraps. load() also runs before the feature is known to be enabled for the site. Install hooks synchronously here and do client work in init(), gated by remote config (getFeatureSettingEnabled) or userPreferences.',
        },
    },
    create(context) {
        const options = context.options[0] || {};
        const methodNames = new Set(options.methodNames?.length ? options.methodNames : DEFAULT_METHOD_NAMES);

        /**
         * Report any client request reached from an `await` or a `return` in the
         * method's own scope - both make the phase depend on the response.
         *
         * @param {any} fn
         * @param {string} messageId
         */
        function checkLifecycleMethod(fn, messageId) {
            if (!fn.body) return;
            // Expression-bodied arrow: `init = async () => this.request(…)` returns the promise
            if (fn.body.type !== 'BlockStatement') {
                reportRequestsIn(fn.body, messageId);
                return;
            }
            walkOwnScope(fn.body, (node) => {
                const blocked = node.type === 'AwaitExpression' ? node.argument : node.type === 'ReturnStatement' ? node.argument : null;
                if (blocked) reportRequestsIn(blocked, messageId);
            });
        }

        /**
         * @param {any} expression an expression whose promise the lifecycle method waits on
         * @param {string} messageId
         */
        function reportRequestsIn(expression, messageId) {
            walkOwnScope(expression, (node) => {
                if (!isClientRequestCall(node, methodNames)) return;
                context.report({
                    node,
                    messageId,
                    data: { name: context.sourceCode.getText(node.callee) },
                });
            });
        }

        /** @param {any} node */
        function checkDefinition(node) {
            const found = lifecycleFunction(node);
            if (found) checkLifecycleMethod(found.fn, found.messageId);
        }

        return {
            MethodDefinition: checkDefinition,
            PropertyDefinition: checkDefinition,
        };
    },
};
