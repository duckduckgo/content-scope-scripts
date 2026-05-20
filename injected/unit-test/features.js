import { platformSupport } from '../src/features.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import * as glob from 'glob';
import { formatErrors } from '@duckduckgo/privacy-configuration/tests/schema-validation.js';
import ApiManipulation from '../src/features/api-manipulation.js';

// TODO: Ignore eslint redeclare as we're linting for esm and cjs
// eslint-disable-next-line no-redeclare
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-redeclare
const __dirname = path.dirname(__filename);

describe('Features definition', () => {
    it('calls `webCompat` before `fingerPrintingScreenSize` https://app.asana.com/0/1177771139624306/1204944717262422/f', () => {
        const arr = platformSupport.apple;
        const webCompatIdx = arr.indexOf('webCompat');
        const fpScreenSizeIdx = arr.indexOf('fingerprintingScreenSize');
        expect(webCompatIdx).not.toBe(-1);
        expect(fpScreenSizeIdx).not.toBe(-1);
        expect(webCompatIdx).toBeLessThan(fpScreenSizeIdx);
    });
});

describe('test-pages/*/config/*.json schema validation', () => {
    let Ajv, schemaGenerator;
    beforeAll(async () => {
        Ajv = (await import('ajv')).default;
        schemaGenerator = await import('ts-json-schema-generator');
    });

    // TODO make the config export all of this so it can be imported
    function createGenerator() {
        return schemaGenerator.createGenerator({
            path: path.resolve(__dirname, '../../node_modules/@duckduckgo/privacy-configuration/schema/config.ts'),
        });
    }

    function getSchema(schemaName) {
        return createGenerator().createSchema(schemaName);
    }

    function createValidator(schemaName) {
        const ajv = new Ajv({ allowUnionTypes: true });
        return ajv.compile(getSchema(schemaName));
    }

    // Utility to ensure 'hash' exists on all features in the config
    // Ideally we would not have these required in the config, it's pretty unnecessary for tests.
    function ensureHashOnFeatures(config) {
        if (config && typeof config === 'object' && config.features) {
            for (const featureKey of Object.keys(config.features)) {
                if (config.features[featureKey] && typeof config.features[featureKey] === 'object') {
                    if (!('hash' in config.features[featureKey])) {
                        config.features[featureKey].hash = '';
                    }
                }
            }
        }
        return config;
    }

    const configFiles = glob
        .sync('../integration-test/test-pages/*/config/*.json', { cwd: __dirname })
        .map((p) => path.resolve(__dirname, p));

    // Legacy allowlist: skip schema validation for these known legacy files
    // Some of these have expected invalid configs
    const legacyAllowlist = [
        // Favicon configs
        path.resolve(__dirname, '../integration-test/test-pages/favicon/config/favicon-disabled.json'),
        path.resolve(__dirname, '../integration-test/test-pages/favicon/config/favicon-absent.json'),
        path.resolve(__dirname, '../integration-test/test-pages/favicon/config/favicon-enabled.json'),
        path.resolve(__dirname, '../integration-test/test-pages/favicon/config/favicon-monitor-disabled.json'),
        // Duckplayer configs
        path.resolve(__dirname, '../integration-test/test-pages/duckplayer/config/overlays-live.json'),
        path.resolve(__dirname, '../integration-test/test-pages/duckplayer/config/click-interceptions-disabled.json'),
        path.resolve(__dirname, '../integration-test/test-pages/duckplayer/config/disabled.json'),
        path.resolve(__dirname, '../integration-test/test-pages/duckplayer/config/overlays-drawer.json'),
        path.resolve(__dirname, '../integration-test/test-pages/duckplayer/config/overlays.json'),
        path.resolve(__dirname, '../integration-test/test-pages/duckplayer/config/thumbnail-overlays-disabled.json'),
        path.resolve(__dirname, '../integration-test/test-pages/duckplayer/config/video-alt-selectors.json'),
        path.resolve(__dirname, '../integration-test/test-pages/duckplayer/config/video-overlays-disabled.json'),
        // Message bridge configs
        path.resolve(__dirname, '../integration-test/test-pages/message-bridge/config/message-bridge-enabled.json'),
        path.resolve(__dirname, '../integration-test/test-pages/message-bridge/config/message-bridge-disabled.json'),
        // Legacy conditionalChanges format (domain at root instead of condition.domain)
        path.resolve(__dirname, '../integration-test/test-pages/ua-ch-brands/config/domain-brand-override-legacy.json'),
        // Uses fireDetectionEvents which is not yet in the published schema
        path.resolve(__dirname, '../integration-test/test-pages/web-interference-detection/config/youtube-detection-events.json'),
    ];
    for (const configPath of configFiles) {
        if (legacyAllowlist.includes(configPath)) {
            xit(`LEGACY: skipped schema validation for ${path.relative(process.cwd(), configPath)}`, () => {});
            continue;
        }
        it(`should match the CurrentGenericConfig schema: ${path.relative(process.cwd(), configPath)}`, async () => {
            let config = JSON.parse(await readFile(configPath, 'utf-8'));
            config = ensureHashOnFeatures(config);
            const validate = createValidator('CurrentGenericConfig');
            const valid = validate(config);
            if (!valid) {
                throw new Error(`Schema validation failed for ${configPath}: ` + formatErrors(validate.errors));
            }
        });
    }
});

describe('ApiManipulation', () => {
    let apiManipulation;
    let dummyTarget;

    beforeEach(() => {
        apiManipulation = new ApiManipulation(
            'apiManipulation',
            {},
            {},
            {
                bundledConfig: { features: { apiManipulation: { state: 'enabled', exceptions: [] } } },
                site: { domain: 'test.com' },
                platform: { version: '1.0.0' },
            },
        );
        dummyTarget = {};
    });

    it('defines a new property if define: true is set and property does not exist', () => {
        const change = {
            type: 'descriptor',
            getterValue: { type: 'string', value: 'defined!' },
            define: true,
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'definedByConfig', change);
        expect(dummyTarget.definedByConfig).toBe('defined!');
    });

    it('does not define a property if define is not set and property does not exist', () => {
        const change = {
            type: 'descriptor',
            getterValue: { type: 'string', value: 'should not exist' },
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'notDefinedByConfig', change);
        expect(dummyTarget.notDefinedByConfig).toBeUndefined();
    });

    it('wraps an existing property if present', () => {
        Object.defineProperty(dummyTarget, 'hardwareConcurrency', {
            get: () => 4,
            configurable: true,
            enumerable: true,
        });
        const change = {
            type: 'descriptor',
            getterValue: { type: 'number', value: 222 },
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'hardwareConcurrency', change);
        // The getter should now return 222
        expect(dummyTarget.hardwareConcurrency).toBe(222);
    });

    it('replaces an existing method value descriptor if present', () => {
        dummyTarget.getUserMedia = () => 'original';
        const change = {
            type: 'descriptor',
            value: { type: 'function', functionName: 'noop' },
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'getUserMedia', change);
        expect(typeof dummyTarget.getUserMedia).toBe('function');
        expect(dummyTarget.getUserMedia()).toBeUndefined();
    });

    it('replaces a DOM-style method value descriptor without define: true', () => {
        const originalFn = function originalFn() {
            return 'original';
        };
        Object.defineProperty(dummyTarget, 'getUserMedia', {
            value: originalFn,
            writable: true,
            configurable: true,
            enumerable: false,
        });
        const change = {
            type: 'descriptor',
            value: {
                type: 'function',
                functionValue: { type: 'string', value: 'overridden' },
            },
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'getUserMedia', change);
        const descriptor = /** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(dummyTarget, 'getUserMedia'));
        expect(descriptor).toBeDefined();
        expect(typeof descriptor.value).toBe('function');
        expect(descriptor.value).not.toBe(originalFn);
        expect(descriptor.value()).toBe('overridden');
        // Original descriptor attributes are preserved through the merge in wrapProperty.
        expect(descriptor.writable).toBeTrue();
        expect(descriptor.configurable).toBeTrue();
        expect(descriptor.enumerable).toBeFalse();
    });

    it('masks the replacement method so toString() and metadata resemble the original', () => {
        function originalGetUserMedia(constraints, opts) {
            return constraints || opts;
        }
        Object.defineProperty(dummyTarget, 'getUserMedia', {
            value: originalGetUserMedia,
            writable: true,
            configurable: true,
            enumerable: false,
        });
        const change = {
            type: 'descriptor',
            value: {
                type: 'function',
                functionValue: { type: 'string', value: 'replacement' },
            },
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'getUserMedia', change);

        // Function still executes the configured replacement.
        expect(dummyTarget.getUserMedia()).toBe('replacement');
        // .name / .length resemble the original method.
        expect(dummyTarget.getUserMedia.name).toBe('originalGetUserMedia');
        expect(dummyTarget.getUserMedia.length).toBe(originalGetUserMedia.length);
        // toString() returns the original method's source rather than the replacement's body.
        const toStringResult = dummyTarget.getUserMedia.toString();
        expect(toStringResult).toBe(Function.prototype.toString.call(originalGetUserMedia));
        expect(toStringResult).toContain('originalGetUserMedia');
        // toString.toString() should still look like Function.prototype.toString itself,
        // mirroring native methods rather than the configured replacement.
        expect(dummyTarget.getUserMedia.toString.toString()).toBe(Function.prototype.toString.toString());
    });

    it('preserves [native code] in toString() when overriding a real native method', () => {
        // Install an actual native function as the existing descriptor so we can
        // assert the override masks against the genuine "[native code]" output
        // rather than against a user-land source string.
        const nativeFn = Object.prototype.hasOwnProperty;
        Object.defineProperty(dummyTarget, 'nativeMethod', {
            value: nativeFn,
            writable: true,
            configurable: true,
            enumerable: false,
        });
        const change = {
            type: 'descriptor',
            value: { type: 'function', functionName: 'noop' },
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'nativeMethod', change);

        expect(dummyTarget.nativeMethod.toString()).toContain('[native code]');
        expect(dummyTarget.nativeMethod.toString()).toBe(Function.prototype.toString.call(nativeFn));
        expect(dummyTarget.nativeMethod.name).toBe('hasOwnProperty');
        expect(dummyTarget.nativeMethod.length).toBe(nativeFn.length);
        // Call still resolves to the configured noop replacement (returns undefined).
        expect(dummyTarget.nativeMethod('foo')).toBeUndefined();
    });

    it('uses captured globals so page tampering with Reflect.apply / Object.defineProperty cannot subvert the masking helper', () => {
        function originalNativeLike(a, b, c) {
            return [a, b, c];
        }

        const realReflectApply = Reflect.apply;
        const realObjectDefineProperty = Object.defineProperty;
        // Use the real defineProperty before tampering to set up the target.
        realObjectDefineProperty.call(Object, dummyTarget, 'protectedMethod', {
            value: originalNativeLike,
            writable: true,
            configurable: true,
            enumerable: false,
        });

        // Replace page-visible globals AFTER constructing the feature. The
        // helper imports captured primitives (`ReflectApply`,
        // `objectDefineProperty`) which were bound at module load, so masking
        // must continue to work and `Object.defineProperty` must never be
        // routed through the page-tampered version.
        const defineSpy = jasmine
            .createSpy('Object.defineProperty')
            .and.callFake((...args) => realObjectDefineProperty.apply(Object, args));
        const applySpy = jasmine.createSpy('Reflect.apply').and.callFake((...args) => realReflectApply.apply(Reflect, args));
        Object.defineProperty = defineSpy;
        Reflect.apply = applySpy;

        const change = {
            type: 'descriptor',
            value: {
                type: 'function',
                functionValue: { type: 'string', value: 'still-routed' },
            },
        };

        try {
            apiManipulation.wrapApiDescriptor(dummyTarget, 'protectedMethod', change);
            // Helper does not route name/length masking through the tampered
            // `Object.defineProperty`. If the helper regresses to using
            // `Object.defineProperty` directly, defineSpy would be hit during
            // wrapping.
            expect(defineSpy).not.toHaveBeenCalled();
            // Masked identity is intact regardless of tampering.
            expect(dummyTarget.protectedMethod.name).toBe('originalNativeLike');
            expect(dummyTarget.protectedMethod.length).toBe(originalNativeLike.length);
            expect(dummyTarget.protectedMethod.toString()).toBe(Function.prototype.toString.call(originalNativeLike));
            // End-to-end invocation still routes to the configured replacement.
            // Note: the outer call goes through `ContentFeature.defineProperty`'s
            // debug-wrapper which still reads `Reflect.apply` from the page —
            // that is outside the scope of this PR's helper. The captured
            // `ReflectApply` inside the helper is what guarantees the inner
            // step (helper -> replacement) cannot be intercepted.
            expect(dummyTarget.protectedMethod(1, 2, 3)).toBe('still-routed');
        } finally {
            Object.defineProperty = realObjectDefineProperty;
            Reflect.apply = realReflectApply;
        }
    });

    it('overrides an existing method value descriptor even when define: true is set', () => {
        const originalFn = function originalFn() {
            return 'original';
        };
        Object.defineProperty(dummyTarget, 'getUserMedia', {
            value: originalFn,
            writable: true,
            configurable: true,
            enumerable: false,
        });
        const change = {
            type: 'descriptor',
            value: {
                type: 'function',
                functionValue: { type: 'string', value: 'overridden' },
            },
            define: true,
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'getUserMedia', change);
        expect(dummyTarget.getUserMedia).not.toBe(originalFn);
        expect(dummyTarget.getUserMedia()).toBe('overridden');
    });

    it('defines a new method if define: true is set and property does not exist', () => {
        const change = {
            type: 'descriptor',
            value: {
                type: 'function',
                functionValue: {
                    type: 'string',
                    value: 'defined by config',
                },
            },
            define: true,
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'definedMethodByConfig', change);
        expect(typeof dummyTarget.definedMethodByConfig).toBe('function');
        expect(dummyTarget.definedMethodByConfig()).toBe('defined by config');
    });

    it('treats value descriptors as valid api changes', () => {
        const change = {
            type: 'descriptor',
            value: { type: 'function', functionName: 'noop' },
        };
        expect(apiManipulation.checkIsValidAPIChange(change)).toBeTrue();
    });

    it('rejects descriptor changes that define both getterValue and value', () => {
        const change = {
            type: 'descriptor',
            getterValue: { type: 'string', value: 'getter' },
            value: { type: 'function', functionName: 'noop' },
        };
        expect(apiManipulation.checkIsValidAPIChange(change)).toBeFalse();
    });

    // --- inherited methods (shadow-define on the target object) ---
    //
    // `MediaDevices.prototype.addEventListener` lives on `EventTarget.prototype`. Remote config
    // (privacy-configuration #5215) overrides it via value descriptors without `define: true`.

    it('shadow-defines an own property when the key is only inherited', () => {
        const proto = { inheritedMethod: () => 'inherited' };
        const target = Object.create(proto);
        expect('inheritedMethod' in target).toBeTrue();
        expect(Object.prototype.hasOwnProperty.call(target, 'inheritedMethod')).toBeFalse();

        const change = {
            type: 'descriptor',
            value: { type: 'function', functionName: 'noop' },
        };
        apiManipulation.wrapApiDescriptor(target, 'inheritedMethod', change);

        expect(Object.prototype.hasOwnProperty.call(target, 'inheritedMethod')).toBeTrue();
        expect(target.inheritedMethod()).toBeUndefined();
        expect(proto.inheritedMethod()).toBe('inherited');
    });

    it('does not define a property when it is missing from the prototype chain and define is omitted', () => {
        const change = {
            type: 'descriptor',
            value: { type: 'function', functionName: 'noop' },
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'missingMethod', change);
        expect(dummyTarget.missingMethod).toBeUndefined();
    });

    it('applies MediaDevices-style apiChanges without define: true', () => {
        const eventTargetProto = {
            addEventListener: () => 'et-add',
            removeEventListener: () => 'et-remove',
        };
        const mediaDevicesProto = Object.create(eventTargetProto);
        Object.defineProperty(mediaDevicesProto, 'ondevicechange', {
            get: () => 'original-handler',
            set: () => {
                throw new Error('original setter must not run');
            },
            configurable: true,
            enumerable: true,
        });
        const target = Object.create(mediaDevicesProto);

        const apiChanges = {
            addEventListener: {
                type: 'descriptor',
                value: { type: 'function', functionName: 'noop' },
            },
            ondevicechange: {
                type: 'descriptor',
                getterValue: { type: 'undefined' },
                setterValue: { type: 'function', functionName: 'noop' },
            },
            removeEventListener: {
                type: 'descriptor',
                value: { type: 'function', functionName: 'noop' },
            },
        };

        for (const [key, change] of Object.entries(apiChanges)) {
            apiManipulation.wrapApiDescriptor(target, key, change);
        }

        expect(Object.prototype.hasOwnProperty.call(target, 'addEventListener')).toBeTrue();
        expect(target.addEventListener()).toBeUndefined();
        expect(eventTargetProto.addEventListener()).toBe('et-add');

        expect(Object.prototype.hasOwnProperty.call(target, 'removeEventListener')).toBeTrue();
        expect(target.removeEventListener()).toBeUndefined();
        expect(eventTargetProto.removeEventListener()).toBe('et-remove');

        expect(target.ondevicechange).toBeUndefined();
        expect(() => {
            target.ondevicechange = () => {};
        }).not.toThrow();
        expect(target.ondevicechange).toBeUndefined();
    });

    it('validates privacy-configuration #5215 MediaDevices apiChanges against schema', async () => {
        const Ajv = (await import('ajv')).default;
        const schemaGenerator = await import('ts-json-schema-generator');
        const schema = schemaGenerator
            .createGenerator({
                path: path.resolve(__dirname, '../../node_modules/@duckduckgo/privacy-configuration/schema/config.ts'),
            })
            .createSchema('CurrentGenericConfig');
        const validate = new Ajv({ allowUnionTypes: true }).compile(schema);
        const config = {
            readme: 'MediaDevices apiManipulation overrides from privacy-configuration #5215',
            version: 1,
            unprotectedTemporary: [],
            features: {
                apiManipulation: {
                    state: 'enabled',
                    exceptions: [],
                    hash: '',
                    settings: {
                        apiChanges: {
                            'MediaDevices.prototype.addEventListener': {
                                type: 'descriptor',
                                value: { type: 'function', functionName: 'noop' },
                            },
                            'MediaDevices.prototype.removeEventListener': {
                                type: 'descriptor',
                                value: { type: 'function', functionName: 'noop' },
                            },
                            'MediaDevices.prototype.ondevicechange': {
                                type: 'descriptor',
                                getterValue: { type: 'undefined' },
                                setterValue: { type: 'function', functionName: 'noop' },
                            },
                        },
                    },
                },
            },
        };
        const valid = validate(config);
        if (!valid) {
            throw new Error('Schema validation failed: ' + formatErrors(validate.errors));
        }
    });

    // --- setterValue: override the setter half of an accessor (for event-handler IDL
    // attributes such as `MediaDevices.prototype.ondevicechange`). Without this, the original
    // setter survives the spread-merge in wrapProperty and assigning to the property still
    // registers a real listener.

    it('overrides the setter when setterValue is supplied alongside getterValue', () => {
        let originalGet = 'original-value';
        let originalSetCalls = 0;
        Object.defineProperty(dummyTarget, 'ondevicechange', {
            get: () => originalGet,
            set: (v) => {
                originalSetCalls++;
                originalGet = v;
            },
            configurable: true,
            enumerable: true,
        });
        const change = {
            type: 'descriptor',
            getterValue: { type: 'string', value: 'overridden-getter' },
            setterValue: { type: 'function', functionName: 'noop' },
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'ondevicechange', change);

        expect(dummyTarget.ondevicechange).toBe('overridden-getter');
        // Assigning must not invoke the original setter - the override swallows it.
        dummyTarget.ondevicechange = 'attempt-to-set';
        expect(originalSetCalls).toBe(0);
        // Getter is unaffected by the assignment because the override returns a constant.
        expect(dummyTarget.ondevicechange).toBe('overridden-getter');
    });

    it('overrides only the setter when setterValue is supplied without getterValue', () => {
        // When only `setterValue` is set the original getter must continue to work so reads
        // remain accurate. Only assignments are intercepted.
        let originalGet = 'original-value';
        let originalSetCalls = 0;
        Object.defineProperty(dummyTarget, 'ondevicechange', {
            get: () => originalGet,
            set: (v) => {
                originalSetCalls++;
                originalGet = v;
            },
            configurable: true,
            enumerable: true,
        });
        const change = {
            type: 'descriptor',
            setterValue: { type: 'function', functionName: 'noop' },
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'ondevicechange', change);

        // Original getter still active.
        expect(dummyTarget.ondevicechange).toBe('original-value');
        // Setter swallowed.
        dummyTarget.ondevicechange = 'attempt-to-set';
        expect(originalSetCalls).toBe(0);
        expect(dummyTarget.ondevicechange).toBe('original-value');
    });

    it('masks a setterValue replacement against the original setter', () => {
        // Mirror an event-handler IDL accessor shape: when the original accessor
        // exposes a native setter (e.g. `Element.prototype.onclick`), the
        // replacement setter's observable identity (`toString()`, `.name`,
        // `.length`) must mirror that original rather than expose our internal
        // `setter(v) {...}` shape.
        let originalCalls = 0;
        function originalOndevicechange(handler) {
            originalCalls++;
            return handler;
        }
        Object.defineProperty(dummyTarget, 'ondevicechange', {
            get: () => null,
            set: originalOndevicechange,
            configurable: true,
            enumerable: true,
        });

        const change = {
            type: 'descriptor',
            setterValue: { type: 'function', functionName: 'noop' },
        };
        apiManipulation.wrapApiDescriptor(dummyTarget, 'ondevicechange', change);

        const wrapped = /** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(dummyTarget, 'ondevicechange'));
        expect(wrapped).toBeDefined();
        const wrappedSetter = /** @type {(v:any) => void} */ (wrapped.set);
        expect(typeof wrappedSetter).toBe('function');
        // Descriptor inspection of `.set` must mirror the original setter rather
        // than expose our JS `setter(v) {...}` shape.
        expect(wrappedSetter.toString()).toBe(Function.prototype.toString.call(originalOndevicechange));
        expect(wrappedSetter.toString()).toContain('originalOndevicechange');
        expect(wrappedSetter.toString.toString()).toBe(Function.prototype.toString.toString());
        expect(wrappedSetter.name).toBe('originalOndevicechange');
        expect(wrappedSetter.length).toBe(originalOndevicechange.length);
        // The configured override still swallows the assignment - the original
        // setter is NOT invoked.
        dummyTarget.ondevicechange = 'attempt';
        expect(originalCalls).toBe(0);
    });

    it('accepts descriptor changes that provide only setterValue', () => {
        // Validation must allow accessor-shape changes where only the setter is being overridden.
        const change = {
            type: 'descriptor',
            setterValue: { type: 'function', functionName: 'noop' },
        };
        expect(apiManipulation.checkIsValidAPIChange(change)).toBeTrue();
    });

    it('rejects descriptor changes that supply both setterValue and value', () => {
        // Mixing accessor and value-descriptor shapes is invalid for a single change.
        const change = {
            type: 'descriptor',
            setterValue: { type: 'function', functionName: 'noop' },
            value: { type: 'function', functionName: 'noop' },
        };
        expect(apiManipulation.checkIsValidAPIChange(change)).toBeFalse();
    });
});
