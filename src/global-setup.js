// This file is used to assist with ordering of setup of globals from utils.js with safe-globals
// It's to allow for the extension to setGlobal in testing

// Only use globalThis for testing this breaks window.wrappedJSObject code in Firefox
// eslint-disable-next-line no-global-assign
export let globalObj = typeof window === 'undefined' ? globalThis : window
export let Error = globalObj.Error

/**
 * Used for testing to override the globals used within this file.
 * @param {window} globalObjIn
 */
export function setGlobal (globalObjIn) {
    globalObj = globalObjIn
    Error = globalObj.Error
}
