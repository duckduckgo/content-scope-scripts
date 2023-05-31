// Capture prototype to prevent overloading
function captureGlobals (object) {
    const newGlobal = object
    for (const key in object) {
        const value = object[key]
        newGlobal[key] = value
    }
    for (const key in object.prototype) {
        const value = object.prototype[key]
        newGlobal.prototype[key] = value
    }
    return newGlobal
}

export const Set = captureGlobals(globalThis.Set)
export const Reflect = captureGlobals(globalThis.Reflect)
