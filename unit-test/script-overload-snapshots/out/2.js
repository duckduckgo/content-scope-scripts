(function (parentScope) {
  /**
  * DuckDuckGo Runtime Checks injected code.
  * If you're reading this, you're probably trying to debug a site that is breaking due to our runtime checks.
  * Please raise an issues on our GitHub repo: https://github.com/duckduckgo/content-scope-scripts/
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
  let _ddg_q = "meep";
  const window = constructProxy(parentScope, {
    single: _ddg_q
  });
  const globalThis = constructProxy(parentScope, {
    single: _ddg_q
  });
  console.log(1)
})(globalThis)