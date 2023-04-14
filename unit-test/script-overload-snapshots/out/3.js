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
  let _ddg_r = (...args) => {
    console.log('debugger', ...args)
    // eslint-disable-next-line no-debugger
    debugger
  };
  let _ddg_s = () => { };
  let _ddg_b = parentScope?.navigator ? parentScope.navigator : Object.bind(null);
  let _ddg_t = () => { };
  let _ddg_a = constructProxy(_ddg_b, {
    noop: _ddg_t
  });
  let navigator = _ddg_a;
  let _ddg_u = undefined;
  const window = constructProxy(parentScope, {
    fn: _ddg_r,
    noop: _ddg_s,
    navigator: _ddg_a,
    nonexistent: _ddg_u
  });
  const globalThis = constructProxy(parentScope, {
    fn: _ddg_r,
    noop: _ddg_s,
    navigator: _ddg_a,
    nonexistent: _ddg_u
  });
  console.log(1)
})(globalThis)