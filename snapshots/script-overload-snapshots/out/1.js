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
  let _ddg_b = parentScope?.navigator ? parentScope.navigator : Object.bind(null);
  let _ddg_c = "testingThisOut";
  let _ddg_e = parentScope?.navigator?.mediaSession ? parentScope.navigator.mediaSession : Object.bind(null);
  let _ddg_f = "playing";
  let _ddg_h = parentScope?.navigator?.mediaSession?.doesNotExist ? parentScope.navigator.mediaSession.doesNotExist : Object.bind(null);
  let _ddg_j = parentScope?.navigator?.mediaSession?.doesNotExist?.depth ? parentScope.navigator.mediaSession.doesNotExist.depth : Object.bind(null);
  let _ddg_l = parentScope?.navigator?.mediaSession?.doesNotExist?.depth?.a ? parentScope.navigator.mediaSession.doesNotExist.depth.a : Object.bind(null);
  let _ddg_m = "boop";
  let _ddg_k = constructProxy(_ddg_l, {
    lot: _ddg_m
  });
  let _ddg_i = constructProxy(_ddg_j, {
    a: _ddg_k
  });
  let _ddg_g = constructProxy(_ddg_h, {
    depth: _ddg_i
  });
  let _ddg_d = constructProxy(_ddg_e, {
    playbackState: _ddg_f,
    doesNotExist: _ddg_g
  });
  let _ddg_a = constructProxy(_ddg_b, {
    userAgent: _ddg_c,
    mediaSession: _ddg_d
  });
  let navigator = _ddg_a;
  let _ddg_o = parentScope?.document ? parentScope.document : Object.bind(null);
  let _ddg_p = "testingThisOut";
  let _ddg_n = constructProxy(_ddg_o, {
    cookie: _ddg_p
  });
  let document = _ddg_n;
  const window = constructProxy(parentScope, {
    navigator: _ddg_a,
    document: _ddg_n
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