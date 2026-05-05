import { createContext, h } from 'preact';
import { useEffect, useReducer } from 'preact/hooks';
import { useSetEnabled, useUserValues } from './UserValuesProvider.jsx';

/**
 * @typedef {'showing' | 'exiting' | 'completed'} SwitchState
 * @typedef {'change' | 'done' | 'enabled' | 'ask'} SwitchEvent
 */

export const SwitchContext = createContext({
    /** @type {SwitchState} */
    state: 'showing',
    /** @type {() => void} */
    onChange: () => {
        throw new Error('must implement');
    },
    /** @type {() => void} */
    onDone: () => {
        throw new Error('must implement');
    },
});

export function SwitchProvider({ children }) {
    const userValues = useUserValues();
    const setEnabled = useSetEnabled();
    const initialState = 'enabled' in userValues.privatePlayerMode ? 'completed' : 'showing';

    const [state, dispatch] = useReducer((/** @type {SwitchState} */ state, /** @type {SwitchEvent} */ event) => {
        console.log('📩', { state, event });
        switch (state) {
            case 'showing': {
                if (event === 'change') {
                    return 'exiting';
                }
                if (event === 'enabled') {
                    return 'completed';
                }
                if (event === 'done') {
                    return 'completed';
                }
                break;
            }
            case 'exiting': {
                if (event === 'done') {
                    return 'completed';
                }
                break;
            }
            case 'completed': {
                if (event === 'ask') {
                    return 'showing';
                }
            }
        }
        return state;
    }, initialState);

    function onChange() {
        dispatch('change');
        setEnabled();
    }

    // sync the userValues with the state of the switch
    useEffect(() => {
        const evt = 'enabled' in userValues.privatePlayerMode ? 'enabled' : 'ask';
        dispatch(evt);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- workaround during eslint react rollout; consider removing and addressing deps
    }, [initialState]);

    function onDone() {
        dispatch('done');
    }

    return <SwitchContext.Provider value={{ state, onChange, onDone }}>{children}</SwitchContext.Provider>;
}
