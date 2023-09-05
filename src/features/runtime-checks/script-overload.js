import { processAttr, getContextId } from '../../utils.js'
import { Object, Reflect } from '@duckduckgo/safe-globals'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalStates = new Set()

function generateUniqueID () {
    const debug = false
    if (debug) {
        // Easier to debug
        return Symbol(globalThis?.crypto?.randomUUID())
    }
    return Symbol(undefined)
}

function addTaint () {
    const contextID = generateUniqueID()
    if ('duckduckgo' in navigator &&
        navigator.duckduckgo &&
        typeof navigator.duckduckgo === 'object' &&
        'taints' in navigator.duckduckgo &&
        navigator.duckduckgo.taints instanceof Set) {
        if (document.currentScript) {
            // @ts-expect-error - contextID is undefined on currentScript
            document.currentScript.contextID = contextID
        }
        navigator?.duckduckgo?.taints.add(contextID)
    }
    return contextID
}

function createContextAwareFunction (fn) {
    return function (...args) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let scope = this
        // Save the previous contextID and set the new one
        const prevContextID = this?.contextID
        // @ts-expect-error - contextID is undefined on window
        // eslint-disable-next-line no-undef
        const changeToContextID = getContextId(this) || contextID
        if (typeof args[0] === 'function') {
            args[0].contextID = changeToContextID
        }
        // @ts-expect-error - scope doesn't match window
        if (scope && scope !== globalThis) {
            scope.contextID = changeToContextID
        } else if (!scope) {
            scope = new Proxy(scope, {
                get (target, prop) {
                    if (prop === 'contextID') {
                        return changeToContextID
                    }
                    return Reflect.get(target, prop)
                }
            })
        }
        // Run the original function with the new contextID
        const result = Reflect.apply(fn, scope, args)

        // Restore the previous contextID
        scope.contextID = prevContextID

        return result
    }
}

/**
 * Indent a code block using braces
 * @param {string} string
 * @returns {string}
 */
function removeIndent (string) {
    const lines = string.split('\n')
    const indentSize = 2
    let currentIndent = 0
    const indentedLines = lines.map((line) => {
        if (line.trim().startsWith('}')) {
            currentIndent -= indentSize
        }
        const indentedLine = ' '.repeat(currentIndent) + line.trim()
        if (line.trim().endsWith('{')) {
            currentIndent += indentSize
        }

        return indentedLine
    })
    return indentedLines.filter(a => a.trim()).join('\n')
}

const lookup = {}
function getOrGenerateIdentifier (path) {
    if (!(path in lookup)) {
        lookup[path] = generateAlphaIdentifier(Object.keys(lookup).length + 1)
    }
    return lookup[path]
}

function generateAlphaIdentifier (num) {
    if (num < 1) {
        throw new Error('Input must be a positive integer')
    }
    const charCodeOffset = 97
    let identifier = ''
    while (num > 0) {
        num--
        const remainder = num % 26
        const charCode = remainder + charCodeOffset
        identifier = String.fromCharCode(charCode) + identifier
        num = Math.floor(num / 26)
    }
    return '_ddg_' + identifier
}

/**
 * @param {*} scope
 * @param {Record<string, any>} outputs
 * @returns {Proxy}
 */
function constructProxy (scope, outputs) {
    const taintString = '__ddg_taint__'
    // @ts-expect-error - Expected 2 arguments, but got 1
    if (Object.is(scope)) {
        // Should not happen, but just in case fail safely
        console.error('Runtime checks: Scope must be an object', scope, outputs)
        return scope
    }
    return new Proxy(scope, {
        get (target, property) {
            const targetObj = target[property]
            let targetOut = target
            if (typeof property === 'string' && property in outputs) {
                targetOut = outputs
            }
            // Reflects functions with the correct 'this' scope
            if (typeof targetObj === 'function') {
                return (...args) => {
                    return Reflect.apply(targetOut[property], target, args)
                }
            } else {
                return Reflect.get(targetOut, property, scope)
            }
        },
        getOwnPropertyDescriptor (target, property) {
            if (typeof property === 'string' && property === taintString) {
                return { configurable: true, enumerable: false, value: true }
            }
            return Reflect.getOwnPropertyDescriptor(target, property)
        }
    })
}

function valToString (val) {
    if (typeof val === 'function') {
        return val.toString()
    }
    return JSON.stringify(val)
}

/**
 * Output scope variable definitions to arbitrary depth
 */
function stringifyScope (scope, scopePath) {
    let output = ''
    for (const [key, value] of scope) {
        const varOutName = getOrGenerateIdentifier([...scopePath, key])
        if (value instanceof Map) {
            const proxyName = getOrGenerateIdentifier(['_proxyFor_', varOutName])
            output += `
            let ${proxyName} = ${scopePath.join('?.')}?.${key} ? ${scopePath.join('.')}.${key} : Object.bind(null);
            `
            const keys = Array.from(value.keys())
            output += stringifyScope(value, [...scopePath, key])
            const proxyOut = keys.map((keyName) => `${keyName}: ${getOrGenerateIdentifier([...scopePath, key, keyName])}`)
            output += `
            let ${varOutName} = constructProxy(${proxyName}, {
                ${proxyOut.join(',\n')}
            });
            `
            // If we're at the top level, we need to add the window and globalThis variables (Eg: let navigator = parentScope_navigator)
            if (scopePath.length === 1) {
                output += `
                let ${key} = ${varOutName};
                `
            }
        } else {
            output += `
            let ${varOutName} = ${valToString(value)};
            `
        }
    }
    return output
}

/**
 * Code generates wrapping variables for code that is injected into the page
 * @param {*} code
 * @param {*} config
 * @returns {string}
 */
export function wrapScriptCodeOverload (code, config) {
    const processedConfig = {}
    for (const [key, value] of Object.entries(config)) {
        processedConfig[key] = processAttr(value)
    }
    // Don't do anything if the config is empty
    if (Object.keys(processedConfig).length === 0) return code

    let prepend = ''
    const aggregatedLookup = new Map()
    let currentScope = null
    /* Convert the config into a map of scopePath -> { key: value } */
    for (const [key, value] of Object.entries(processedConfig)) {
        const path = key.split('.')

        currentScope = aggregatedLookup
        const pathOut = path[path.length - 1]
        // Traverse the path and create the nested objects
        path.slice(0, -1).forEach((pathPart) => {
            if (!currentScope.has(pathPart)) {
                currentScope.set(pathPart, new Map())
            }
            currentScope = currentScope.get(pathPart)
        })
        currentScope.set(pathOut, value)
    }

    prepend += stringifyScope(aggregatedLookup, ['parentScope'])
    // Stringify top level keys
    const keysOut = [...aggregatedLookup.keys()].map((keyName) => `${keyName}: ${getOrGenerateIdentifier(['parentScope', keyName])}`).join(',\n')
    prepend += `
    const window = constructProxy(parentScope, {
        ${keysOut}
    });
    // Ensure globalThis === window
    const globalThis = window
    `
    // Hack to use default capture instead of rollups replaced variable names.
    // This is covered by testing so should break if rollup is changed.
    const proxyString = constructProxy.toString().replaceAll('Object$1', 'Object').replaceAll('Reflect$1', 'Reflect')
    return removeIndent(`(function (parentScope) {
        /**
         * DuckDuckGo Runtime Checks injected code.
         * If you're reading this, you're probably trying to debug a site that is breaking due to our runtime checks.
         * Please raise an issues on our GitHub repo: https://github.com/duckduckgo/content-scope-scripts/
         */
        ${proxyString}
        ${prepend}

        ${getContextId.toString()}
        ${generateUniqueID.toString()}
        ${createContextAwareFunction.toString()}
        ${addTaint.toString()}
        const contextID = addTaint()
        
        const originalSetTimeout = setTimeout
        setTimeout = createContextAwareFunction(originalSetTimeout)
        
        const originalSetInterval = setInterval
        setInterval = createContextAwareFunction(originalSetInterval)
        
        const originalPromiseThen = Promise.prototype.then
        Promise.prototype.then = createContextAwareFunction(originalPromiseThen)
        
        const originalPromiseCatch = Promise.prototype.catch
        Promise.prototype.catch = createContextAwareFunction(originalPromiseCatch)
        
        const originalPromiseFinally = Promise.prototype.finally
        Promise.prototype.finally = createContextAwareFunction(originalPromiseFinally)

        ${code}
    })(globalThis)
    `)
}
