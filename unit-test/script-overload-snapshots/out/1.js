(function (parentScope) {
  /**
  * DuckDuckGo Runtime Checks injected code.
  * If you're reading this, you're probably trying to debug a site that is breaking due to our runtime checks.
  * Please raise an issues on our GitHub repo: https://github.com/duckduckgo/content-scope-scripts/
  */
  function constructProxy (scope, outputs) {
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
          return Reflect.get(targetOut, property, receiver)
        }
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
  const globalThis = constructProxy(parentScope, {
    navigator: _ddg_a,
    document: _ddg_n
  });
  console.log(1)
})(globalThis)