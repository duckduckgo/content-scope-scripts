import { DDGProxy, DDGReflect } from '../utils';
import { computeOffScreenCanvas } from '../canvas';
import ContentFeature from '../content-feature';

export default class FingerprintingCanvas extends ContentFeature {
    init(args) {
        const { sessionKey, site } = args;
        const domainKey = site.domain;
        const additionalEnabledCheck = this.getFeatureSettingEnabled('additionalEnabledCheck');
        if (!additionalEnabledCheck) {
            // If additionalEnabledCheck is not enabled bail out early.
            // This is a temporary measure to allow for experiment rollout without feature enabling in C-S-S experiments.
            return;
        }
        const supportsWebGl = this.getFeatureSettingEnabled('webGl');

        const unsafeCanvases = new WeakSet();
        const canvasContexts = new WeakMap();
        const canvasCache = new WeakMap();

        /**
         * Clear cache as canvas has changed
         * @param {OffscreenCanvas | HTMLCanvasElement} canvas
         */
        function clearCache(canvas) {
            canvasCache.delete(canvas);
        }

        /**
         * @param {OffscreenCanvas | HTMLCanvasElement} canvas
         */
        function treatAsUnsafe(canvas) {
            unsafeCanvases.add(canvas);
            clearCache(canvas);
        }

        const proxy = new DDGProxy(this, HTMLCanvasElement.prototype, 'getContext', {
            apply(target, thisArg, args) {
                const context = DDGReflect.apply(target, thisArg, args);
                try {
                    // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'.
                    canvasContexts.set(thisArg, context);
                } catch {}
                return context;
            },
        });
        proxy.overload();

        // Known data methods
        const safeMethods = this.getFeatureSetting('safeMethods') ?? ['putImageData', 'drawImage'];
        for (const methodName of safeMethods) {
            const safeMethodProxy = new DDGProxy(this, CanvasRenderingContext2D.prototype, methodName, {
                apply(target, thisArg, args) {
                    // Don't apply escape hatch for canvases
                    if (methodName === 'drawImage' && args[0] && args[0] instanceof HTMLCanvasElement) {
                        treatAsUnsafe(args[0]);
                    } else {
                        // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                        clearCache(thisArg.canvas);
                    }
                    return DDGReflect.apply(target, thisArg, args);
                },
            });
            safeMethodProxy.overload();
        }

        const unsafeMethods = this.getFeatureSetting('unsafeMethods') ?? [
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
            'createPattern',
        ];
        for (const methodName of unsafeMethods) {
            // Some methods are browser specific
            if (methodName in CanvasRenderingContext2D.prototype) {
                const unsafeProxy = new DDGProxy(this, CanvasRenderingContext2D.prototype, methodName, {
                    apply(target, thisArg, args) {
                        // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                        treatAsUnsafe(thisArg.canvas);
                        return DDGReflect.apply(target, thisArg, args);
                    },
                });
                unsafeProxy.overload();
            }
        }

        if (supportsWebGl) {
            const unsafeGlMethods = this.getFeatureSetting('unsafeGlMethods') ?? [
                'commit',
                'compileShader',
                'shaderSource',
                'attachShader',
                'createProgram',
                'linkProgram',
                'drawElements',
                'drawArrays',
            ];
            const glContexts = [WebGLRenderingContext];
            if ('WebGL2RenderingContext' in globalThis) {
                glContexts.push(WebGL2RenderingContext);
            }
            for (const context of glContexts) {
                for (const methodName of unsafeGlMethods) {
                    // Some methods are browser specific
                    if (methodName in context.prototype) {
                        const unsafeProxy = new DDGProxy(this, context.prototype, methodName, {
                            apply(target, thisArg, args) {
                                // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                                treatAsUnsafe(thisArg.canvas);
                                return DDGReflect.apply(target, thisArg, args);
                            },
                        });
                        unsafeProxy.overload();
                    }
                }
            }
        }

        // Using proxies here to swallow calls to toString etc
        const getImageDataProxy = new DDGProxy(this, CanvasRenderingContext2D.prototype, 'getImageData', {
            apply(target, thisArg, args) {
                // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                if (!unsafeCanvases.has(thisArg.canvas)) {
                    return DDGReflect.apply(target, thisArg, args);
                }
                // Anything we do here should be caught and ignored silently
                try {
                    // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                    const { offScreenCtx } = getCachedOffScreenCanvasOrCompute(thisArg.canvas, domainKey, sessionKey);
                    // Call the original method on the modified off-screen canvas
                    return DDGReflect.apply(target, offScreenCtx, args);
                } catch {}

                return DDGReflect.apply(target, thisArg, args);
            },
        });
        getImageDataProxy.overload();

        /**
         * Get cached offscreen if one exists, otherwise compute one
         *
         * @param {HTMLCanvasElement} canvas
         * @param {string} domainKey
         * @param {string} sessionKey
         */
        function getCachedOffScreenCanvasOrCompute(canvas, domainKey, sessionKey) {
            let result;
            if (canvasCache.has(canvas)) {
                result = canvasCache.get(canvas);
            } else {
                const ctx = canvasContexts.get(canvas);
                result = computeOffScreenCanvas(canvas, domainKey, sessionKey, getImageDataProxy, ctx);
                canvasCache.set(canvas, result);
            }
            return result;
        }

        const canvasMethods = this.getFeatureSetting('canvasMethods') ?? ['toDataURL', 'toBlob'];
        for (const methodName of canvasMethods) {
            const proxy = new DDGProxy(this, HTMLCanvasElement.prototype, methodName, {
                apply(target, thisArg, args) {
                    // Short circuit for low risk canvas calls
                    // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                    if (!unsafeCanvases.has(thisArg)) {
                        return DDGReflect.apply(target, thisArg, args);
                    }
                    try {
                        // @ts-expect-error - error TS18048: 'thisArg' is possibly 'undefined'
                        const { offScreenCanvas } = getCachedOffScreenCanvasOrCompute(thisArg, domainKey, sessionKey);
                        // Call the original method on the modified off-screen canvas
                        return DDGReflect.apply(target, offScreenCanvas, args);
                    } catch {
                        // Something we did caused an exception, fall back to the native
                        return DDGReflect.apply(target, thisArg, args);
                    }
                },
            });
            proxy.overload();
        }
    }
}
