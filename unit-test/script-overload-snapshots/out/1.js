(function (parentScope) {function constructProxy (scope, outputs) {
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
                let _proxyFor_parentScope_navigator
                if (parentScope?.navigator === undefined) {
                    _proxyFor_parentScope_navigator = Object.bind(null);
                } else {
                    _proxyFor_parentScope_navigator = parentScope.navigator;
                }
                
                let parentScope_navigator_userAgent = "testingThisOut";
                
                let _proxyFor_parentScope_navigator_mediaSession
                if (parentScope?.navigator?.mediaSession === undefined) {
                    _proxyFor_parentScope_navigator_mediaSession = Object.bind(null);
                } else {
                    _proxyFor_parentScope_navigator_mediaSession = parentScope.navigator.mediaSession;
                }
                
                let parentScope_navigator_mediaSession_playbackState = "playing";
                
                let _proxyFor_parentScope_navigator_mediaSession_doesNotExist
                if (parentScope?.navigator?.mediaSession?.doesNotExist === undefined) {
                    _proxyFor_parentScope_navigator_mediaSession_doesNotExist = Object.bind(null);
                } else {
                    _proxyFor_parentScope_navigator_mediaSession_doesNotExist = parentScope.navigator.mediaSession.doesNotExist;
                }
                
                let _proxyFor_parentScope_navigator_mediaSession_doesNotExist_depth
                if (parentScope?.navigator?.mediaSession?.doesNotExist?.depth === undefined) {
                    _proxyFor_parentScope_navigator_mediaSession_doesNotExist_depth = Object.bind(null);
                } else {
                    _proxyFor_parentScope_navigator_mediaSession_doesNotExist_depth = parentScope.navigator.mediaSession.doesNotExist.depth;
                }
                
                let _proxyFor_parentScope_navigator_mediaSession_doesNotExist_depth_a
                if (parentScope?.navigator?.mediaSession?.doesNotExist?.depth?.a === undefined) {
                    _proxyFor_parentScope_navigator_mediaSession_doesNotExist_depth_a = Object.bind(null);
                } else {
                    _proxyFor_parentScope_navigator_mediaSession_doesNotExist_depth_a = parentScope.navigator.mediaSession.doesNotExist.depth.a;
                }
                
                let parentScope_navigator_mediaSession_doesNotExist_depth_a_lot = "boop";
                
                let parentScope_navigator_mediaSession_doesNotExist_depth_a = constructProxy(_proxyFor_parentScope_navigator_mediaSession_doesNotExist_depth_a, {lot: parentScope_navigator_mediaSession_doesNotExist_depth_a_lot});
                
                let parentScope_navigator_mediaSession_doesNotExist_depth = constructProxy(_proxyFor_parentScope_navigator_mediaSession_doesNotExist_depth, {a: parentScope_navigator_mediaSession_doesNotExist_depth_a});
                
                let parentScope_navigator_mediaSession_doesNotExist = constructProxy(_proxyFor_parentScope_navigator_mediaSession_doesNotExist, {depth: parentScope_navigator_mediaSession_doesNotExist_depth});
                
                let parentScope_navigator_mediaSession = constructProxy(_proxyFor_parentScope_navigator_mediaSession, {playbackState: parentScope_navigator_mediaSession_playbackState, doesNotExist: parentScope_navigator_mediaSession_doesNotExist});
                
                let parentScope_navigator = constructProxy(_proxyFor_parentScope_navigator, {userAgent: parentScope_navigator_userAgent, mediaSession: parentScope_navigator_mediaSession});
                
                    let navigator = parentScope_navigator;
                    
                let _proxyFor_parentScope_document
                if (parentScope?.document === undefined) {
                    _proxyFor_parentScope_document = Object.bind(null);
                } else {
                    _proxyFor_parentScope_document = parentScope.document;
                }
                
                let parentScope_document_cookie = "testingThisOut";
                
                let parentScope_document = constructProxy(_proxyFor_parentScope_document, {cookie: parentScope_document_cookie});
                
                    let document = parentScope_document;
                    
    const window = constructProxy(parentScope, {
        navigator: parentScope_navigator,
document: parentScope_document
    });
    const globalThis = constructProxy(parentScope, {
        navigator: parentScope_navigator,
document: parentScope_document
    });
    console.log(1)})(globalThis)