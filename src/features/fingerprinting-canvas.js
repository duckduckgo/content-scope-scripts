import { DDGProxy, DDGReflect } from '../utils'
import { computeOffScreenCanvas } from '../canvas'

export function init (args) {
    const { sessionKey, site } = args
    const domainKey = site.domain
    const featureName = 'fingerprinting-canvas'

    const unsafeCanvases = new WeakSet()
    const canvasContexts = new WeakMap()
    const canvasCache = new WeakMap()

    function clearCache (canvas) {
        // Clear cache as canvas has changed
        canvasCache.delete(canvas)
    }

    const proxy = new DDGProxy(featureName, HTMLCanvasElement.prototype, 'getContext', {
        apply (target, thisArg, args) {
            const context = DDGReflect.apply(target, thisArg, args)
            try {
                canvasContexts.set(thisArg, context)
            } catch {
            }
            return context
        }
    })
    proxy.overload()

    // Known data methods
    const safeMethods = ['putImageData', 'drawImage']
    for (const methodName of safeMethods) {
        const safeMethodProxy = new DDGProxy(featureName, CanvasRenderingContext2D.prototype, methodName, {
            apply (target, thisArg, args) {
                clearCache(thisArg.canvas)
                return DDGReflect.apply(target, thisArg, args)
            }
        })
        safeMethodProxy.overload()
    }

    const unsafeMethods = [
        'strokeRect',
        'bezierCurveTo',
        'quadraticCurveTo',
        'arcTo',
        'ellipse',
        'rect',
        'fill',
        'stroke',
        'lineTo',
        'beginPath',
        'closePath',
        'arc',
        'fillText',
        'fillRect',
        'strokeText',
        'createConicGradient',
        'createLinearGradient',
        'createRadialGradient',
        'createPattern'
    ]
    for (const methodName of unsafeMethods) {
        // Some methods are browser specific
        if (methodName in CanvasRenderingContext2D.prototype) {
            const unsafeProxy = new DDGProxy(featureName, CanvasRenderingContext2D.prototype, methodName, {
                apply (target, thisArg, args) {
                    unsafeCanvases.add(thisArg.canvas)
                    clearCache(thisArg.canvas)
                    return DDGReflect.apply(target, thisArg, args)
                }
            })
            unsafeProxy.overload()
        }
    }

    const unsafeGlMethods = [
        'commit',
        'compileShader',
        'shaderSource',
        'attachShader',
        'createProgram',
        'linkProgram'
    ]
    const glContexts = [
        WebGL2RenderingContext,
        WebGLRenderingContext
    ]
    for (const context of glContexts) {
        for (const methodName of unsafeGlMethods) {
            // Some methods are browser specific
            if (methodName in context.prototype) {
                const unsafeProxy = new DDGProxy(featureName, context.prototype, methodName, {
                    apply (target, thisArg, args) {
                        unsafeCanvases.add(thisArg.canvas)
                        clearCache(thisArg.canvas)
                        return DDGReflect.apply(target, thisArg, args)
                    }
                })
                unsafeProxy.overload()
            }
        }
    }

    // Using proxies here to swallow calls to toString etc
    const getImageDataProxy = new DDGProxy(featureName, CanvasRenderingContext2D.prototype, 'getImageData', {
        apply (target, thisArg, args) {
            if (!unsafeCanvases.has(thisArg.canvas)) {
                return DDGReflect.apply(target, thisArg, args)
            }
            // Anything we do here should be caught and ignored silently
            try {
                const { offScreenCtx } = getCachedOffScreenCanvasOrCompute(thisArg.canvas, domainKey, sessionKey)
                // Call the original method on the modified off-screen canvas
                return DDGReflect.apply(target, offScreenCtx, args)
            } catch {
            }

            return DDGReflect.apply(target, thisArg, args)
        }
    })
    getImageDataProxy.overload()

    /**
     * Get cached offscreen if one exists, otherwise compute one
     *
     * @param {HTMLCanvasElement} canvas
     * @param {string} domainKey
     * @param {string} sessionKey
     */
    function getCachedOffScreenCanvasOrCompute (canvas, domainKey, sessionKey) {
        let result
        if (canvasCache.has(canvas)) {
            result = canvasCache.get(canvas)
        } else {
            const ctx = canvasContexts.get(canvas)
            result = computeOffScreenCanvas(canvas, domainKey, sessionKey, getImageDataProxy, ctx)
            canvasCache.set(canvas, result)
        }
        return result
    }

    const canvasMethods = ['toDataURL', 'toBlob']
    for (const methodName of canvasMethods) {
        const proxy = new DDGProxy(featureName, HTMLCanvasElement.prototype, methodName, {
            apply (target, thisArg, args) {
                // Short circuit for low risk canvas calls
                if (!unsafeCanvases.has(thisArg)) {
                    return DDGReflect.apply(target, thisArg, args)
                }
                try {
                    const { offScreenCanvas } = getCachedOffScreenCanvasOrCompute(thisArg, domainKey, sessionKey)
                    // Call the original method on the modified off-screen canvas
                    return DDGReflect.apply(target, offScreenCanvas, args)
                } catch {
                    // Something we did caused an exception, fall back to the native
                    return DDGReflect.apply(target, thisArg, args)
                }
            }
        })
        proxy.overload()
    }
}
