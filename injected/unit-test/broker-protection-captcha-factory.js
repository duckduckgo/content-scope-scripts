import { CaptchaFactory } from '../src/features/broker-protection/captcha-services/factory.js';

/**
 * Minimal stand-in provider so these tests exercise the factory's
 * registration/alias logic without depending on real provider DOM mechanisms.
 * @param {string} type
 */
function createStubProvider(type) {
    return /** @type {import('../src/features/broker-protection/captcha-services/providers/provider.interface').CaptchaProvider} */ (
        /** @type {unknown} */ ({
            getType: () => type,
            isSupportedForElement: () => false,
            canSolve: () => false,
        })
    );
}

describe('CaptchaFactory', () => {
    describe('registerProvider', () => {
        it('registers a provider under its own type', () => {
            const factory = new CaptchaFactory();
            const provider = createStubProvider('image');

            factory.registerProvider(provider);

            expect(factory.getProviderByType('image')).toBe(provider);
        });

        it('returns null for an unknown type', () => {
            const factory = new CaptchaFactory();

            expect(factory.getProviderByType('does-not-exist')).toBe(null);
        });

        it('registers a provider under each of its aliases', () => {
            const factory = new CaptchaFactory();
            const provider = createStubProvider('image');

            factory.registerProvider(provider, { aliases: ['red-circle', 'local-llm'] });

            // The canonical type still resolves to the provider...
            expect(factory.getProviderByType('image')).toBe(provider);
            // ...and so does each alias, returning the same instance.
            expect(factory.getProviderByType('red-circle')).toBe(provider);
            expect(factory.getProviderByType('local-llm')).toBe(provider);
        });

        it('does not register any aliases when none are provided', () => {
            const factory = new CaptchaFactory();
            const provider = createStubProvider('image');

            factory.registerProvider(provider, {});

            expect(factory.getProviderByType('image')).toBe(provider);
            expect(factory.getProviderByType('red-circle')).toBe(null);
        });

        it('handles an empty aliases array without registering extras', () => {
            const factory = new CaptchaFactory();
            const provider = createStubProvider('image');

            factory.registerProvider(provider, { aliases: [] });

            expect(factory.getProviderByType('image')).toBe(provider);
        });

        it('does not expose aliases as additional providers during detection', () => {
            const factory = new CaptchaFactory();
            const provider = createStubProvider('image');
            spyOn(provider, 'isSupportedForElement').and.returnValue(true);

            factory.registerProvider(provider, { aliases: ['red-circle', 'local-llm'] });

            // Even though the provider is registered under three keys, detection
            // should consider it once (find returns the first match) and never
            // double-count aliased entries.
            const root = /** @type {any} */ ({});
            const element = /** @type {any} */ ({});
            const detected = factory.detectProvider(root, element);
            expect(detected).toBe(provider);
            expect(provider.isSupportedForElement).toHaveBeenCalledTimes(1);
        });
    });
});
