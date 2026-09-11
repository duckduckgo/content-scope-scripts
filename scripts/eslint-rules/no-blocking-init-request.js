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
 * The object a method is called on, with any member chain unwrapped:
 * `this.messaging.request()` -> `this`, `messages.initialSetup()` -> `messages`.
 *
 * @param {any} callee
 */
function calleeRoot(callee) {
    let root = callee.object;
    while (root && root.type === 'MemberExpression') {
        root = root.object;
    }
    return root;
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
    return calleeRoot(callee)?.type === 'ThisExpression';
}

/**
 * True if `node` mentions `this.messaging` anywhere.
 *
 * @param {any} node
 */
function mentionsMessaging(node) {
    let found = false;
    walkOwnScope(node, (child) => {
        if (
            child.type === 'MemberExpression' &&
            child.object?.type === 'ThisExpression' &&
            child.property?.type === 'Identifier' &&
            child.property.name === 'messaging'
        ) {
            found = true;
        }
    });
    return found;
}

/**
 * True for a call on a messaging wrapper - an object built from `this.messaging`,
 * as features do with their `*Messages` classes. Both of these are a round trip
 * to the client, one layer down from `this.request()`:
 *
 *     const messages = new DuckPlayerNativeMessages(this.messaging, env);
 *     await messages.initialSetup();          // a local
 *
 *     get messages() { return new FeatureMessages(this.messaging); }
 *     await this.messages.initialSetup();     // a class member
 *
 * We resolve the local through scope, and the class member through the
 * surrounding class body, rather than matching on method names - so an
 * unrelated `await someClient.request()` stays untouched.
 *
 * @param {any} node
 * @param {import('eslint').Rule.RuleContext} context
 * @param {any} classBody the class the lifecycle method belongs to, if any
 */
function isMessagingWrapperCall(node, context, classBody) {
    if (node.type !== 'CallExpression') return false;
    const callee = node.callee;
    if (!callee || callee.type !== 'MemberExpression') return false;
    const root = calleeRoot(callee);

    if (root?.type === 'ThisExpression') return isMessagingMember(callee, classBody);
    if (root?.type !== 'Identifier') return false;

    /** @type {import('eslint').Scope.Scope | null} */
    let scope = context.sourceCode.getScope(node);
    /** @type {import('eslint').Scope.Variable | null} */
    let variable = null;
    while (scope && !variable) {
        variable = scope.variables.find((candidate) => candidate.name === root.name) || null;
        scope = scope.upper;
    }
    return (variable?.defs || []).some(
        (def) => def.type === 'Variable' && def.node.init && !FUNCTION_TYPES.has(def.node.init.type) && mentionsMessaging(def.node.init),
    );
}

/**
 * For a callee rooted at `this`, whether the property it hangs off is a member
 * of this class built from `this.messaging` - a `get messages()` accessor or a
 * `messages = new FeatureMessages(this.messaging)` field.
 *
 * @param {any} callee
 * @param {any} classBody
 */
function isMessagingMember(callee, classBody) {
    if (!classBody) return false;
    // Step down to the property hanging directly off `this`: for
    // `this.messages.initialSetup`, that's `this.messages`.
    let owner = callee.object;
    while (owner?.type === 'MemberExpression' && owner.object?.type === 'MemberExpression') {
        owner = owner.object;
    }
    if (owner?.type !== 'MemberExpression' || owner.object?.type !== 'ThisExpression') return false;
    const name = owner.property?.type === 'Identifier' || owner.property?.type === 'PrivateIdentifier' ? owner.property.name : null;
    if (!name) return false;

    return (classBody.body || []).some((member) => {
        const key = member.key?.type === 'Identifier' || member.key?.type === 'PrivateIdentifier' ? member.key.name : null;
        if (key !== name) return false;
        // A getter's body, or a field's initialiser
        return mentionsMessaging(member.value?.body || member.value);
    });
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
        // `return await this.request(…)` is reached twice, via the return and via
        // the await. Report each call once.
        const reported = new WeakSet();

        /**
         * Report any client request reached from an `await` or a `return` in the
         * method's own scope - both make the phase depend on the response.
         *
         * @param {any} fn
         * @param {string} messageId
         * @param {any} classBody
         */
        function checkLifecycleMethod(fn, messageId, classBody) {
            if (!fn.body) return;
            // Expression-bodied arrow: `init = async () => this.request(…)` returns the promise
            if (fn.body.type !== 'BlockStatement') {
                reportRequestsIn(fn.body, messageId, classBody);
                return;
            }
            walkOwnScope(fn.body, (node) => {
                const blocked = node.type === 'AwaitExpression' ? node.argument : node.type === 'ReturnStatement' ? node.argument : null;
                if (blocked) reportRequestsIn(blocked, messageId, classBody);
            });
        }

        /**
         * @param {any} expression an expression whose promise the lifecycle method waits on
         * @param {string} messageId
         * @param {any} classBody
         */
        function reportRequestsIn(expression, messageId, classBody) {
            walkOwnScope(expression, (node) => {
                if (!isClientRequestCall(node, methodNames) && !isMessagingWrapperCall(node, context, classBody)) return;
                if (reported.has(node)) return;
                reported.add(node);
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
            // `node.parent` is the ClassBody: set already, since ESLint enters the
            // class before this definition. Descendants of `node` are not yet
            // traversed, so their `parent` cannot be relied on here.
            if (found) checkLifecycleMethod(found.fn, found.messageId, node.parent);
        }

        return {
            MethodDefinition: checkDefinition,
            PropertyDefinition: checkDefinition,
        };
    },
};
