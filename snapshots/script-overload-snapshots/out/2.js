(function (parentScope) {
  /**
  * DuckDuckGo Runtime Checks injected code.
  * If you're reading this, you're probably trying to debug a site that is breaking due to our runtime checks.
  * Please raise an issues on our GitHub repo: https://github.com/duckduckgo/content-scope-scripts/
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
      get (target, property, receiver) {
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
  let _ddg_q = "meep";
  const window = constructProxy(parentScope, {
    single: _ddg_q
  });
  // Ensure globalThis === window
  const globalThis = window
  function getContextId (scope) {
    if (document?.currentScript && 'contextID' in document.currentScript) {
      return document.currentScript.contextID
    }
    if (scope.contextID) {
      return scope.contextID
    }
    // @ts-expect-error - contextID is a global variable
    if (typeof contextID !== 'undefined') {
      // @ts-expect-error - contextID is a global variable
      // eslint-disable-next-line no-undef
      return contextID
    }
  }
  function generateUniqueID () {
    const debug = true
    if (debug) {
      // Easier to debug
      return Symbol(globalThis?.crypto?.randomUUID())
    }
    return Symbol(undefined)
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
  function addTaint () {
    const contextID = generateUniqueID()
    if ('duckduckgo' in navigator &&
    navigator.duckduckgo &&
    typeof navigator.duckduckgo === 'object' &&
    'taints' in navigator.duckduckgo &&
    navigator.duckduckgo.taints instanceof Set) {
      if (document.currentScript) {
        // @ts-expect-error - contextID is undefined on cuttentScript
        document.currentScript.contextID = contextID
      }
      navigator?.duckduckgo?.taints.add(contextID)
    }
    return contextID
  }
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
  console.log(1)
})(globalThis)