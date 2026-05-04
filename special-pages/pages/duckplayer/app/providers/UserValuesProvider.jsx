import { useContext, useState, useEffect } from 'preact/hooks';
import { h, createContext } from 'preact';
import { useMessaging } from '../types.js';

/**
 * @typedef {import("../../types/duckplayer.js").UserValues} UserValues
 */

const UserValuesContext = createContext({
    /** @type {UserValues} */
    value: {
        privatePlayerMode: { alwaysAsk: {} },
        overlayInteracted: false,
    },
    /**
     * @type {() => void}
     */
    setEnabled: () => {
        // throw new Error('must implement')
    },
});

/**
 * @param {object} props
 * @param {UserValues} props.initial
 * @param {import("preact").ComponentChild} props.children
 */
export function UserValuesProvider({ initial, children }) {
    // initial state
    const [value, setValue] = useState(initial);
    const messaging = useMessaging();

    // listen for updates
    useEffect(() => {
        window.addEventListener('toggle-user-values-enabled', () => {
            setValue({ privatePlayerMode: { enabled: {} }, overlayInteracted: false });
        });
        window.addEventListener('toggle-user-values-ask', () => {
            setValue({ privatePlayerMode: { alwaysAsk: {} }, overlayInteracted: false });
        });
        const unsubscribe = messaging.onUserValuesChanged((userValues) => {
            setValue(userValues);
        });
        return () => unsubscribe();
    }, [messaging]);

    // API for consumers
    async function setEnabled() {
        const values = {
            privatePlayerMode: { enabled: {} },
            overlayInteracted: false,
        };
        try {
            const next = await messaging.setUserValues(values);
            console.log('response after setUserValues...', next);
            console.log('will set', values);
            setValue(values);
        } catch (err) {
            console.error('could not set the enabled flag', err);
            messaging.reportPageException({ message: 'could not set the enabled flag: ' + err.toString() });
        }
    }

    return <UserValuesContext.Provider value={{ value, setEnabled }}>{children}</UserValuesContext.Provider>;
}

export function useUserValues() {
    return useContext(UserValuesContext).value;
}

export function useSetEnabled() {
    return useContext(UserValuesContext).setEnabled;
}
