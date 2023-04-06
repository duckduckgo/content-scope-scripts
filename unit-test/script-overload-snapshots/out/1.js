(function (parentScope) {
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
  let _ddg_b
  if (parentScope?.navigator === undefined) {
    _ddg_b = Object.bind(null);
  } else {
    _ddg_b = parentScope.navigator;
  }
  let _ddg_c = "testingThisOut";
  let _ddg_e
  if (parentScope?.navigator?.mediaSession === undefined) {
    _ddg_e = Object.bind(null);
  } else {
    _ddg_e = parentScope.navigator.mediaSession;
  }
  let _ddg_f = "playing";
  let _ddg_h
  if (parentScope?.navigator?.mediaSession?.doesNotExist === undefined) {
    _ddg_h = Object.bind(null);
  } else {
    _ddg_h = parentScope.navigator.mediaSession.doesNotExist;
  }
  let _ddg_j
  if (parentScope?.navigator?.mediaSession?.doesNotExist?.depth === undefined) {
    _ddg_j = Object.bind(null);
  } else {
    _ddg_j = parentScope.navigator.mediaSession.doesNotExist.depth;
  }
  let _ddg_l
  if (parentScope?.navigator?.mediaSession?.doesNotExist?.depth?.a === undefined) {
    _ddg_l = Object.bind(null);
  } else {
    _ddg_l = parentScope.navigator.mediaSession.doesNotExist.depth.a;
  }
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
  let _ddg_o
  if (parentScope?.document === undefined) {
    _ddg_o = Object.bind(null);
  } else {
    _ddg_o = parentScope.document;
  }
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