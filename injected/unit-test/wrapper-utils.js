import { shimInterface, shimProperty, wrapProperty, wrapMethod, wrapFunction, wrapToString } from '../src/wrapper-utils.js';

describe('Shim API', () => {
    // MediaSession is just an example, to make it close to reality
    /** @type {typeof MediaSession} */
    let MyMediaSession;

    let definePropertyFn;
    let navigatorPrototype;
    let navigator;

    beforeEach(() => {
        expect(globalThis.MediaSession).toBeUndefined();
        MyMediaSession = class {
            metadata = null;
            /** @type {MediaSession['playbackState']} */
            playbackState = 'none';

            setActionHandler() {
                return 123;
            }

            async setCameraActive() {}
            async setMicrophoneActive() {}
            setPositionState() {}
        };
        definePropertyFn = spyOn(Object, 'defineProperty').and.callThrough();

        navigatorPrototype = {};
        function NavigatorConstructor() {}
        NavigatorConstructor.prototype = navigatorPrototype;
        navigator = new NavigatorConstructor();
    });

    afterEach(() => {
        // @ts-expect-error globalThis is read-only
        delete globalThis.MediaSession;
    });

    describe('shimInterface()', () => {
        it('should (re)define the global', () => {
            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    wrapToString: true,
                    disallowConstructor: false,
                    allowConstructorCall: false,
                },
                definePropertyFn,
            );
            expect(definePropertyFn).toHaveBeenCalledTimes(2);
            const NewMediaSession = globalThis.MediaSession;
            expect(NewMediaSession).toBeDefined();
            const newPropertyDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'MediaSession');

            expect({ ...newPropertyDescriptor, value: null })
                .withContext('property descriptors should match')
                .toEqual({ value: null, writable: true, enumerable: false, configurable: true });
            expect(NewMediaSession.name).toBe('MediaSession');

            expect(new MyMediaSession() instanceof NewMediaSession)
                .withContext('instances should pass the instanceof check')
                .toBeTrue();
            expect(new NewMediaSession() instanceof NewMediaSession)
                .withContext('instances should pass the instanceof check')
                .toBeTrue();
        });

        it('should support disallowConstructor', () => {
            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    disallowConstructor: false,
                    allowConstructorCall: false,
                    wrapToString: true,
                },
                definePropertyFn,
            );
            expect(() => new globalThis.MediaSession()).not.toThrow();

            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    disallowConstructor: true,
                    allowConstructorCall: false,
                    wrapToString: true,
                },
                definePropertyFn,
            );
            expect(() => new globalThis.MediaSession()).toThrowError(TypeError);

            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    disallowConstructor: true,
                    constructorErrorMessage: 'friendly message',
                    allowConstructorCall: false,
                    wrapToString: true,
                },
                definePropertyFn,
            );
            expect(() => new globalThis.MediaSession()).toThrowMatching(
                (err) => err instanceof TypeError && err.message === 'friendly message',
            );
        });

        it('should support allowConstructorCall', () => {
            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    allowConstructorCall: true,
                    wrapToString: true,
                    disallowConstructor: false,
                },
                definePropertyFn,
            );
            // @ts-expect-error real MediaSession is not callable
            expect(() => globalThis.MediaSession()).not.toThrow();
            // @ts-expect-error real MediaSession is not callable
            expect(globalThis.MediaSession() instanceof globalThis.MediaSession)
                .withContext('instances should pass the instanceof check')
                .toBeTrue();

            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    allowConstructorCall: false,
                    wrapToString: true,
                    disallowConstructor: false,
                },
                definePropertyFn,
            );
            // @ts-expect-error real MediaSession is not callable
            expect(() => globalThis.MediaSession()).toThrowError(TypeError);
        });

        it('should support wrapToString', () => {
            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    wrapToString: false,
                    disallowConstructor: false,
                    allowConstructorCall: false,
                },
                definePropertyFn,
            );
            expect(globalThis.MediaSession.toString()).not.toContain('class');
            expect(globalThis.MediaSession.toString.toString())
                .withContext("Shim's toString.toString() should not be masked")
                .toBe(MyMediaSession.toString.toString());
            expect(globalThis.MediaSession.prototype.setActionHandler.toString())
                .withContext("Shim's method's .toString() should not be masked")
                .toBe(MyMediaSession.prototype.setActionHandler.toString());

            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    wrapToString: true,
                    disallowConstructor: false,
                    allowConstructorCall: false,
                },
                definePropertyFn,
            );

            expect(globalThis.MediaSession.toString()).toBe('function MediaSession() { [native code] }');
            expect(globalThis.MediaSession.toString.toString()).toBe('function toString() { [native code] }');
            expect(globalThis.MediaSession.prototype.setActionHandler.toString()).toBe('function setActionHandler() { [native code] }');
        });
    });

    describe('shimProperty()', () => {
        it('should correctly shim the property', () => {
            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    wrapToString: true,
                    disallowConstructor: false,
                    allowConstructorCall: false,
                },
                definePropertyFn,
            );
            const instance = new MyMediaSession();
            shimProperty(navigatorPrototype, 'mediaSession', instance, false, definePropertyFn);

            const NewMediaSession = globalThis.MediaSession;
            expect(navigator.mediaSession instanceof NewMediaSession)
                .withContext('instances should pass the instanceof check')
                .toBeTrue();
            expect(navigator.mediaSession.setActionHandler()).withContext('method should return expected value').toBe(123);
            expect(navigator.mediaSession.toString()).toBe('[object MediaSession]');
            expect(navigator.mediaSession.toString.toString()).toBe('function toString() { [native code] }');
        });

        it('should support writable properties', () => {
            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    wrapToString: true,
                    disallowConstructor: false,
                    allowConstructorCall: false,
                },
                definePropertyFn,
            );
            const instance = new MyMediaSession();
            shimProperty(navigatorPrototype, 'mediaSession', instance, false, definePropertyFn);

            const descriptor = Object.getOwnPropertyDescriptor(navigatorPrototype, 'mediaSession');
            // @ts-expect-error we know it's defined
            descriptor.value = null;
            expect(descriptor).toEqual(
                {
                    value: null,
                    configurable: true,
                    enumerable: true,
                    writable: true,
                },
                'property should be writable',
            );
        });

        it('should support readonly properties', () => {
            shimInterface(
                'MediaSession',
                MyMediaSession,
                {
                    wrapToString: true,
                    disallowConstructor: false,
                    allowConstructorCall: false,
                },
                definePropertyFn,
            );
            const instance = new MyMediaSession();
            shimProperty(navigatorPrototype, 'mediaSession', instance, true, definePropertyFn);

            /** @type {import('../src/wrapper-utils').StrictAccessorDescriptor} */
            // @ts-expect-error we know it's defined
            const descriptor = Object.getOwnPropertyDescriptor(navigatorPrototype, 'mediaSession');

            expect(descriptor.get).toBeDefined();
            expect(descriptor.set).toBeUndefined();

            const getter = descriptor.get;

            // @ts-expect-error we know it's defined
            descriptor.get = null;
            expect(descriptor).toEqual({
                // @ts-expect-error get is overridden
                get: null,
                // @ts-expect-error set is overridden
                set: undefined,
                configurable: true,
                enumerable: true,
            });

            expect(getter.toString()).toBe('function get mediaSession() { [native code] }');
        });
    });
});

describe('wrapProperty', () => {
    it('returns undefined for null object', () => {
        expect(wrapProperty(null, 'test', {}, Object.defineProperty)).toBeUndefined();
    });

    it('returns undefined when property does not exist', () => {
        expect(wrapProperty({}, 'nonExistent', { get: () => 1 }, Object.defineProperty)).toBeUndefined();
    });

    it('wraps a getter property', () => {
        const obj = {};
        Object.defineProperty(obj, 'prop', {
            get: () => 'original',
            configurable: true,
            enumerable: true,
        });
        const origDesc = wrapProperty(obj, 'prop', { get: () => 'wrapped' }, Object.defineProperty);
        expect(origDesc).toBeDefined();
        expect(obj.prop).toBe('wrapped');
    });

    it('wraps a value property', () => {
        const obj = { prop: 'original' };
        const origDesc = wrapProperty(obj, 'prop', { value: 'wrapped' }, Object.defineProperty);
        expect(origDesc).toBeDefined();
        expect(obj.prop).toBe('wrapped');
    });

    it('throws when descriptor type mismatches', () => {
        const obj = {};
        Object.defineProperty(obj, 'prop', {
            get: () => 'original',
            configurable: true,
            enumerable: true,
        });
        expect(() => wrapProperty(obj, 'prop', { value: 'mismatch' }, Object.defineProperty)).toThrowError(/Property descriptor/);
    });
});

describe('wrapMethod', () => {
    it('returns undefined for null object', () => {
        expect(wrapMethod(null, 'test', () => {}, Object.defineProperty)).toBeUndefined();
    });

    it('returns undefined when method does not exist', () => {
        expect(wrapMethod({}, 'nonExistent', () => {}, Object.defineProperty)).toBeUndefined();
    });

    it('wraps a method and calls the wrapper', () => {
        const obj = {
            greet(name) {
                return `Hello, ${name}`;
            },
        };
        const origDesc = wrapMethod(
            obj,
            'greet',
            (origFn, ...args) => {
                return origFn.call(obj, ...args) + '!';
            },
            Object.defineProperty,
        );
        expect(origDesc).toBeDefined();
        expect(obj.greet('World')).toBe('Hello, World!');
    });

    it('throws when property is not a function', () => {
        const obj = { notAMethod: 42 };
        expect(() => wrapMethod(obj, 'notAMethod', () => {}, Object.defineProperty)).toThrowError(/does not look like a method/);
    });
});

describe('wrapFunction', () => {
    it('creates a proxy that calls the wrapped function', () => {
        const real = function add(/** @type {number} */ a, /** @type {number} */ b) {
            return a + b;
        };
        const wrapped = wrapFunction(function (/** @type {number} */ a, /** @type {number} */ b) {
            return real(a, b) * 2;
        }, real);
        // @ts-expect-error - proxy is callable via apply trap
        expect(wrapped(2, 3)).toBe(10); // (2+3)*2
    });

    it('preserves toString of the real target', () => {
        function original() {}
        /** @type {any} */
        const wrapped = wrapFunction(() => {}, original);
        expect(wrapped.toString()).toBe(original.toString());
    });

    it('returns non-toString properties from the real target', () => {
        /** @type {any} */
        const original = function () {};
        original.customProp = 'test';
        /** @type {any} */
        const wrapped = wrapFunction(() => {}, original);
        expect(wrapped.customProp).toBe('test');
    });
});

describe('wrapToString', () => {
    it('returns non-functions unchanged', () => {
        expect(wrapToString(42, () => {})).toBe(42);
        expect(wrapToString('str', () => {})).toBe('str');
    });

    it('wraps a function to fake toString', () => {
        function original() {}
        const wrapper = () => {};
        const wrapped = wrapToString(wrapper, original);
        expect(wrapped.toString()).toBe(original.toString());
    });

    it('supports custom mockValue', () => {
        function original() {}
        const wrapper = () => {};
        const wrapped = wrapToString(wrapper, original, 'custom toString');
        expect(wrapped.toString()).toBe('custom toString');
    });
});
