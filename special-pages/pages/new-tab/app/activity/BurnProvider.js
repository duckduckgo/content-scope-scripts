import { h, createContext } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { ActivityApiContext, ActivityServiceContext } from './ActivityProvider';
import { ACTION_BURN } from './constants.js';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';
import { batch, signal, useSignal, useSignalEffect } from '@preact/signals';

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

    async function didClick(e) {
        const button = /** @type {HTMLButtonElement|null} */ (e.target?.closest(`button[value][data-action="${ACTION_BURN}"]`));
        if (!button) return originalDidClick(e);

        e.preventDefault();
        e.stopImmediatePropagation();

        if (burning.value.length > 0 || exiting.value.length > 0) return console.warn('ignoring additional burn');

        const value = button.value;
        const response = await service?.confirmBurn(value);
        if (response && response.action === 'none') return console.log('action: none');
        burning.value = burning.value.concat(value);
        const p1 = new Promise((resolve) => {
            window.addEventListener(
                'done-exiting',
                () => {
                    exiting.value = [];
                    console.log('WAIT:✅done-exiting');
                    resolve(null);
                },
                { once: true },
            );
        });
        const p2 = new Promise((resolve) => {
            const unsub = service?.onBurnComplete(() => {
                resolve(null);
                unsub?.();
                console.log('WAIT:✅onBurnComplete');
            });
        });
        const all = Promise.all([p1, p2]);
        await Promise.race([all, new Promise((resolve) => setTimeout(resolve, 3000))]);
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
