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
  let _ddg_q = "meep";
  const window = constructProxy(parentScope, {
    single: _ddg_q
  });
  const globalThis = constructProxy(parentScope, {
    single: _ddg_q
  });
  console.log(1)
})(globalThis)