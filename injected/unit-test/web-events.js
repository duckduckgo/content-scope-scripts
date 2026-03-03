import { WebEvents } from '../src/features/web-events.js';

describe('WebEvents', () => {
    describe('fireEvent', () => {
        /**
         * @param {Record<string, any>} event
         * @returns {{ method: string, params: Record<string, any> }}
         */
        function captureNotify(event) {
            /** @type {{ method: string, params: Record<string, any> } | null} */
            let captured = null;
            const args = {
                site: { domain: 'example.com', url: 'https://example.com' },
                platform: {},
                featureSettings: {},
                bundledConfig: undefined,
                messagingContextName: 'test',
            };
            const instance = new WebEvents('webEvents', undefined, {}, args);
            instance._messaging = {
                notify: (/** @type {string} */ method, /** @type {Record<string, any>} */ params) => {
                    captured = { method, params };
                },
            };
            instance.fireEvent(event);
            if (!captured) throw new Error('notify was not called');
            return captured;
        }

        it('sends correct method and params for a basic event', () => {
            const { method, params } = captureNotify({ type: 'adwall' });
            expect(method).toBe('webEvent');
            expect(params).toEqual({ type: 'adwall', data: undefined });
        });

        it('forwards data field when provided', () => {
            const { params } = captureNotify({ type: 'adwall', data: { extra: 'info' } });
            expect(params).toEqual({ type: 'adwall', data: { extra: 'info' } });
        });

        it('never includes nativeData in the params', () => {
            const { params } = captureNotify({ type: 'adwall' });
            expect('nativeData' in params).toBe(false);
        });

        it('never includes nativeData even when data is provided', () => {
            const { params } = captureNotify({ type: 'adwall', data: { foo: 'bar' } });
            expect('nativeData' in params).toBe(false);
        });

        it('strips unknown fields and never passes nativeData', () => {
            // Even if someone passes nativeData in the event object, fireEvent destructures
            // only { type, data }, so nativeData should never appear in the outgoing message.
            const { params } = captureNotify(/** @type {any} */ ({ type: 'adwall', nativeData: { bad: true } }));
            expect('nativeData' in params).toBe(false);
        });
    });
});
