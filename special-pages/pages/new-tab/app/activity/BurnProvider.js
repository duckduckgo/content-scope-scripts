import { h, createContext } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { ActivityApiContext, ActivityServiceContext } from './ActivityProvider';
import { ACTION_BURN } from './constants.js';
import { batch, signal, useSignal } from '@preact/signals';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';

export const ActivityBurningSignalContext = createContext({
    /** @type {import("@preact/signals").Signal<string[]>} */
    burning: signal([]),
    /** @type {import("@preact/signals").Signal<string[]>} */
    exiting: signal([]),
});

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function BurnProvider({ children }) {
    const burning = useSignal(/** @type {string[]} */ ([]));
    const exiting = useSignal(/** @type {string[]} */ ([]));
    const { didClick: originalDidClick } = useContext(ActivityApiContext);
    const service = useContext(ActivityServiceContext);
    const { isReducedMotion } = useEnv();

    async function didClick(e) {
        const button = /** @type {HTMLButtonElement|null} */ (e.target?.closest(`button[value][data-action="${ACTION_BURN}"]`));
        if (!button) return originalDidClick(e);
        if (!service) throw new Error('unreachable');

        e.preventDefault();
        e.stopImmediatePropagation();

        if (burning.value.length > 0 || exiting.value.length > 0) return console.warn('ignoring additional burn');

        const value = button.value;
        const response = await service?.confirmBurn(value);
        if (response && response.action === 'none') return console.log('action: none');

        // stop the service broadcasting any updates for a mo
        service.disableBroadcast();

        // mark this item as burning - this will prevent further events until we're done
        burning.value = burning.value.concat(value);

        // wait for a signal from the FE that we can continue
        const feSignals = any(reducedMotion(isReducedMotion), animationExit(), didChangeDocumentVisibility());

        // the signal from native that burning was complete
        const nativeSignal = didCompleteNatively(service);

        // at least 1 FE signal + 1 native signal is required to continue
        const required = all(feSignals, nativeSignal);

        // but don't wait any longer than 3 seconds
        const withTimer = any(required, timer(3000));

        // exec the chain
        await toPromise(withTimer);

        // when we get here, clear out all state
        batch(() => {
            exiting.value = [];
            burning.value = [];
        });

        // and re-enable the data broadcasting
        service?.enableBroadcast();
    }

    useEffect(() => {
        const handler = (e) => {
            if (e.detail.url) {
                batch(() => {
                    burning.value = burning.value.filter((x) => x !== e.detail.url);
                    exiting.value = exiting.value.concat(e.detail.url);
                    console.log('[done-burning]', e.detail.url, e.detail.reason);
                    console.log(' ╰ [exiting]', exiting.value);
                    console.log(' ╰ [burning]', burning.value);
                });
            }
        };
        window.addEventListener('done-burning', handler);
        return () => {
            window.removeEventListener('done-burning', handler);
        };
    }, [burning, exiting]);

    return (
        <ActivityBurningSignalContext.Provider value={{ burning, exiting }}>
            <ActivityApiContext.Provider value={{ didClick }}>{children}</ActivityApiContext.Provider>
        </ActivityBurningSignalContext.Provider>
    );
}

function toPromise(fn) {
    return new Promise((resolve) => {
        const cleanup = fn({
            next: (v) => {
                resolve(v);
                cleanup();
            },
        });
    });
}

function reducedMotion(isReducedMotion) {
    console.log('+[reducedMotion] setup');
    return (subject) => {
        if (isReducedMotion) {
            console.log('  .next() [reducedMotion] setup');
            subject.next();
        }
    };
}

function animationExit() {
    return (subject) => {
        console.log('+[didExit] setup');
        const handler = () => {
            console.log('  .next() -> [didExit]');
            subject.next();
        };
        window.addEventListener('done-exiting', handler, { once: true });
        return () => {
            console.log('-[didExit] teardown');
            window.removeEventListener('done-exiting', handler);
        };
    };
}

function timer(ms) {
    return (subject) => {
        console.log('+[timer] setup');
        const int = setTimeout(() => {
            console.log('  .next() -> [timer]');
            return subject.next();
        }, ms);
        return () => {
            console.log('-[timer] teardown');
            clearTimeout(int);
        };
    };
}

function didCompleteNatively(service) {
    return (subject) => {
        console.log('+[didCompleteNatively] setup');
        const unsub = service?.onBurnComplete(() => {
            console.log('  .next() -> [didCompleteNatively] ');
            subject.next();
        });
        return () => {
            console.log('-[didCompleteNatively] teardown');
            unsub();
        };
    };
}

function didChangeDocumentVisibility() {
    return (subject) => {
        console.log('+[didChangeVisibility] setup');
        const handler = () => {
            console.log('  .next() -> [didChangeVisibility] resolve ');
            return subject.next(document.visibilityState);
        };
        document.addEventListener('visibilitychange', handler, { once: true });
        return () => {
            console.log('-[didChangeVisibility] teardown');
            window.removeEventListener('visibilitychange', handler);
        };
    };
}

function any(...fns) {
    return (subject) => {
        const jobs = fns.map((factory) => {
            const subject = {
                /** @type {any} */
                next: undefined,
            };
            const promise = new Promise((resolve) => (subject.next = resolve));
            const cleanup = factory(subject);
            return {
                promise,
                cleanup,
            };
        });

        Promise.any(jobs.map((x) => x.promise))
            // eslint-disable-next-line promise/prefer-await-to-then
            .then((d) => subject.next(d))
            // eslint-disable-next-line promise/prefer-await-to-then
            .catch(console.error);

        return () => {
            for (const job of jobs) {
                job.cleanup?.();
            }
        };
    };
}

function all(...fns) {
    return (subject) => {
        const jobs = fns.map((factory) => {
            const subject = {
                /** @type {any} */
                next: undefined,
            };
            const promise = new Promise((resolve) => (subject.next = resolve));
            const cleanup = factory(subject);
            return {
                promise,
                cleanup,
            };
        });

        Promise.all(jobs.map((x) => x.promise))
            // eslint-disable-next-line promise/prefer-await-to-then
            .then((d) => subject.next(d))
            // eslint-disable-next-line promise/prefer-await-to-then
            .catch(console.error);

        return () => {
            for (const job of jobs) {
                job.cleanup?.();
            }
        };
    };
}
