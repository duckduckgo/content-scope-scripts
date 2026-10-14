import ContentFeature from '../content-feature.js';
import { Promise as CapturedPromise, DOMException as CapturedDOMException } from '../captured-globals.js';

const CapturedAbortController = globalThis.AbortController;
const CapturedAbortSignal = globalThis.AbortSignal;
const capturedSetTimeout = globalThis.setTimeout?.bind(globalThis);

const MEDIATION_CONDITIONAL = 'conditional';
// How long to wait for an aborted conditional request to settle before letting other requests proceed.
const WAIT_LIMIT_MS = 1000;

/**
 * @typedef {object} ConditionalRequest
 * @property {AbortController} controller - aborts the request in WebKit
 * @property {Promise<void>} settled - resolves once WebKit has settled the request
 */

/**
 * Keeps conditional-mediation passkey requests (`navigator.credentials.get({ mediation: 'conditional' })`)
 * from being orphaned in WebKit. WebKit doesn't cancel a pending conditional request when the page goes
 * away or when another passkey request starts, and the macOS passkey service then rejects every later
 * passkey request from the browser until it restarts. This feature cancels the request itself:
 *
 * - When the page is hidden, it aborts the pending conditional request and rejects new ones until the
 *   page is shown again.
 * - Before a modal `get` or a `create`, it aborts the pending conditional request and waits for it to
 *   settle (up to 1 s). Conditional requests started meanwhile are held until the modal request settles.
 * - A second conditional request is rejected with `NotAllowedError` without reaching WebKit, as the
 *   system would reject it anyway.
 *
 * Requests are tracked per frame. Everything else passes through to the native implementation.
 */
export default class PasskeyRequestGuard extends ContentFeature {
    /** @type {ConditionalRequest | null} */
    #current = null;
    #hidden = false;
    // Modal get/create calls in flight, and a promise that resolves when the count drops to zero.
    #modalCount = 0;
    /** @type {Promise<void>} */
    #modalIdle = CapturedPromise.resolve();
    #releaseModalIdle = () => {};

    init() {
        if (
            typeof CredentialsContainer === 'undefined' ||
            typeof CapturedAbortController !== 'function' ||
            typeof CapturedAbortSignal !== 'function' ||
            typeof capturedSetTimeout !== 'function'
        ) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const feature = this;

        this.wrapMethod(
            CredentialsContainer.prototype,
            'get',
            /** @this {CredentialsContainer} */ function (originalGet, ...args) {
                // Native get() reports errors through the returned promise, never a synchronous throw.
                try {
                    const options = args[0];
                    if (!options || !options.publicKey || (options.signal && !(options.signal instanceof CapturedAbortSignal))) {
                        return originalGet.apply(this, args);
                    }
                    if (options.mediation === MEDIATION_CONDITIONAL) {
                        return feature.startConditional(originalGet, this, options);
                    }
                    return feature.startModal(originalGet, this, args);
                } catch (e) {
                    return CapturedPromise.reject(e);
                }
            },
        );

        this.wrapMethod(
            CredentialsContainer.prototype,
            'create',
            /** @this {CredentialsContainer} */ function (originalCreate, ...args) {
                try {
                    const options = args[0];
                    if (!options || !options.publicKey) {
                        return originalCreate.apply(this, args);
                    }
                    return feature.startModal(originalCreate, this, args);
                } catch (e) {
                    return CapturedPromise.reject(e);
                }
            },
        );

        globalThis.addEventListener?.('pagehide', () => {
            this.#hidden = true;
            this.#current?.controller.abort();
            this.#current = null;
        });
        globalThis.addEventListener?.('pageshow', () => {
            this.#hidden = false;
        });
    }

    /**
     * @param {number} ms
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new CapturedPromise((resolve) => capturedSetTimeout(resolve, ms));
    }

    /**
     * Aborts the pending conditional request and waits for it to settle, giving up after `WAIT_LIMIT_MS`.
     * @param {ConditionalRequest} request
     */
    async abortCurrent(request) {
        request.controller.abort();
        await CapturedPromise.race([request.settled, this.sleep(WAIT_LIMIT_MS)]);
        if (this.#current === request) {
            this.#current = null;
        }
    }

    /**
     * Starts a conditional request in WebKit with a signal the feature controls, forwarding the page's abort.
     * @param {Function} originalGet
     * @param {CredentialsContainer} receiver
     * @param {CredentialRequestOptions} options
     * @returns {Promise<Credential | null>}
     */
    track(originalGet, receiver, options) {
        const controller = new CapturedAbortController();
        const pageSignal = options.signal;
        const forward = () => controller.abort(pageSignal?.reason);
        pageSignal?.addEventListener('abort', forward, { once: true });
        // Inherit the page's options so WebKit sees them unchanged, apart from the signal.
        const forwarded = Object.create(options, { signal: { value: controller.signal, enumerable: true } });
        /** @type {Promise<Credential | null>} */
        const result = originalGet.call(receiver, forwarded);
        /** @type {ConditionalRequest} */
        const request = { controller, settled: CapturedPromise.resolve() };
        const settle = () => {
            pageSignal?.removeEventListener('abort', forward);
            if (this.#current === request) {
                this.#current = null;
            }
        };
        request.settled = this.afterSettling(result, settle);
        this.#current = request;
        return result;
    }

    /**
     * @param {Function} originalGet
     * @param {CredentialsContainer} receiver
     * @param {CredentialRequestOptions} options
     * @returns {Promise<Credential | null>}
     */
    startConditional(originalGet, receiver, options) {
        if (options.signal?.aborted) {
            return originalGet.call(receiver, options);
        }
        if (this.#hidden) {
            return CapturedPromise.reject(new CapturedDOMException('The page is hidden.', 'AbortError'));
        }
        if (this.#modalCount === 0 && !this.#current) {
            return this.track(originalGet, receiver, options);
        }
        return this.startConditionalLater(originalGet, receiver, options);
    }

    /**
     * Holds a conditional request while a modal request is in flight or a previous conditional request is
     * settling, and rejects it if another conditional request is still pending.
     * @param {Function} originalGet
     * @param {CredentialsContainer} receiver
     * @param {CredentialRequestOptions} options
     * @returns {Promise<Credential | null>}
     */
    async startConditionalLater(originalGet, receiver, options) {
        const pageSignal = options.signal;
        /** @type {() => void} */
        let onPageAbort = () => {};
        // Resolves when the page aborts this request, so a held request rejects right away.
        /** @type {Promise<void> | null} */
        const pageAborted = pageSignal
            ? new CapturedPromise((resolve) => {
                  onPageAbort = resolve;
                  pageSignal.addEventListener('abort', onPageAbort, { once: true });
              })
            : null;
        /** @param {Promise<void>} promise */
        const waitFor = (promise) => (pageAborted ? CapturedPromise.race([promise, pageAborted]) : promise);
        // Pages that start a new request before aborting the old one do so within the same task, so the
        // rejection waits one task for the page's own abort.
        let yielded = false;
        try {
            for (;;) {
                if (pageSignal?.aborted) {
                    throw pageSignal.reason;
                }
                if (this.#modalCount > 0) {
                    await waitFor(this.#modalIdle);
                    continue;
                }
                if (this.#hidden) {
                    throw new CapturedDOMException('The page is hidden.', 'AbortError');
                }
                const current = this.#current;
                if (!current) {
                    return await this.track(originalGet, receiver, options);
                }
                if (!current.controller.signal.aborted) {
                    if (yielded) {
                        throw new CapturedDOMException('Another passkey request is pending.', 'NotAllowedError');
                    }
                    yielded = true;
                    await waitFor(this.sleep(0));
                    continue;
                }
                await waitFor(this.abortCurrent(current));
            }
        } finally {
            pageSignal?.removeEventListener('abort', onPageAbort);
        }
    }

    /**
     * Runs a modal get or a create after aborting the pending conditional request, and holds new conditional
     * requests until it settles.
     * @param {Function} originalFn
     * @param {CredentialsContainer} receiver
     * @param {unknown[]} args
     * @returns {Promise<unknown>}
     */
    startModal(originalFn, receiver, args) {
        if (this.#modalCount++ === 0) {
            this.#modalIdle = new CapturedPromise((resolve) => {
                this.#releaseModalIdle = resolve;
            });
        }
        const endModal = () => {
            if (--this.#modalCount === 0) {
                this.#releaseModalIdle();
            }
        };
        /** @type {Promise<unknown>} */
        let result;
        try {
            const current = this.#current;
            result = current ? this.runAfterAbort(current, originalFn, receiver, args) : originalFn.apply(receiver, args);
        } catch (e) {
            endModal();
            throw e;
        }
        void this.afterSettling(result, endModal);
        return result;
    }

    /**
     * @param {ConditionalRequest} request
     * @param {Function} originalFn
     * @param {CredentialsContainer} receiver
     * @param {unknown[]} args
     * @returns {Promise<unknown>}
     */
    async runAfterAbort(request, originalFn, receiver, args) {
        await this.abortCurrent(request);
        return originalFn.apply(receiver, args);
    }

    /**
     * Runs `callback` once `promise` settles, without handling the promise for its other consumers.
     * @param {Promise<unknown>} promise
     * @param {() => void} callback
     * @returns {Promise<void>}
     */
    async afterSettling(promise, callback) {
        try {
            await promise;
        } catch {
            // The caller of the original promise handles its rejection.
        } finally {
            callback();
        }
    }
}
