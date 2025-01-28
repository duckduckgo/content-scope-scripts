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
    const { isReducedMotion } = useEnv();

    function didClick(e) {
        const button = /** @type {HTMLButtonElement|null} */ (e.target?.closest(`button[value][data-action="${ACTION_BURN}"]`));
        if (!button) return originalDidClick(e);

        e.preventDefault();
        e.stopImmediatePropagation();

        const value = button.value;
        service
            ?.confirmBurn(value)
            // eslint-disable-next-line promise/prefer-await-to-then
            .then((response) => {
                if (response.action === 'burn') {
                    if (isReducedMotion) {
                        service.burnAnimationComplete(e.detail.url);
                    } else {
                        burning.value = burning.value.concat(value);
                    }
                }
            })
            // eslint-disable-next-line promise/prefer-await-to-then
            .catch((e) => console.error(e));
    }

    useSignalEffect(() => {
        const handler = (e) => {
            if (e.detail.url) {
                batch(() => {
                    burning.value = burning.value.filter((x) => x !== e.detail.url);
                    exiting.value = exiting.value.concat(e.detail.url);
                });
            }
        };
        window.addEventListener('done-burning', handler);
        return () => {
            window.removeEventListener('done-burning', handler);
        };
    });

    useEffect(() => {
        const handler = (e) => {
            if (!service) return console.warn('could not access the service');
            if (!e.detail.url) return console.warn('missing detail.url on the custom event');

            exiting.value = exiting.value.filter((x) => x !== e.detail.url);
            service.burnAnimationComplete(e.detail.url);
        };
        window.addEventListener('done-exiting', handler);
        return () => {
            window.removeEventListener('done-exiting', handler);
        };
    }, [service]);

    return (
        <ActivityBurningSignalContext.Provider value={{ burning, exiting }}>
            <ActivityApiContext.Provider value={{ didClick }}>{children}</ActivityApiContext.Provider>
        </ActivityBurningSignalContext.Provider>
    );
}
