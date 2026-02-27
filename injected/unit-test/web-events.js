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
            const instance = Object.create(WebEvents.prototype);
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

        it('never includes nativeClient in the params', () => {
            const { params } = captureNotify({ type: 'adwall' });
            expect('nativeClient' in params).toBe(false);
        });

        it('never includes nativeClient even when data is provided', () => {
            const { params } = captureNotify({ type: 'adwall', data: { foo: 'bar' } });
            expect('nativeClient' in params).toBe(false);
        });

        it('strips unknown fields and never passes nativeClient', () => {
            // Even if someone passes nativeClient in the event object, fireEvent destructures
            // only { type, data }, so nativeClient should never appear in the outgoing message.
            const { params } = captureNotify(
                /** @type {any} */ ({ type: 'adwall', nativeClient: { bad: true } }),
            );
            expect('nativeClient' in params).toBe(false);
        });
    });
});
