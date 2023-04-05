import { processAttr } from '../../utils.js'

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

/**
 * @param {*} scope
 * @param {Record<string, any>} outputs
 * @returns {Proxy}
 */
function constructProxy (scope, outputs) {
    if (Object.is(scope)) {
        // Should not happen, but just in case fail safely
        console.error('Runtime checks: Scope must be an object', scope, outputs)
        return scope
    }
    return new Proxy(scope, {
        get (target, property, receiver) {
            const targetObj = target[property]
            if (typeof targetObj === 'function') {
                return (...args) => {
                    return Reflect.apply(target[property], target, args)
                }
            } else {
                if (typeof property === 'string' && property in outputs) {
                    return Reflect.get(outputs, property, receiver)
                }
                return Reflect.get(target, property, receiver)
            }
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
        const varOutName = [...scopePath, key].join('_')
        if (value instanceof Map) {
            const proxyName = `_proxyFor_${varOutName}`
            output += `
            let ${proxyName}
            if (${scopePath.join('?.')}?.${key} === undefined) {
                ${proxyName} = Object.bind(null);
            } else {
                ${proxyName} = ${scopePath.join('.')}.${key};
            }
            `
            const keys = Array.from(value.keys())
            output += stringifyScope(value, [...scopePath, key])
            const proxyOut = keys.map((keyName) => `${keyName}: ${[...scopePath, key, keyName].join('_')}`)
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
            let ${varOutName} = ${JSON.stringify(value)};
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
        path.slice(0, -1).forEach((pathPart, index) => {
            if (!currentScope.has(pathPart)) {
                currentScope.set(pathPart, new Map())
            }
            currentScope = currentScope.get(pathPart)
        })
        currentScope.set(pathOut, value)
    }

    prepend += stringifyScope(aggregatedLookup, ['parentScope'])
    // Stringify top level keys
    const keysOut = [...aggregatedLookup.keys()].map((keyName) => `${keyName}: parentScope_${keyName}`).join(',\n')
    prepend += `
    const window = constructProxy(parentScope, {
        ${keysOut}
    });
    const globalThis = constructProxy(parentScope, {
        ${keysOut}
    });
    `
    return removeIndent(`(function (parentScope) {
        ${constructProxy.toString()}
        ${prepend}
        ${code}
    })(globalThis)
    `)
}
